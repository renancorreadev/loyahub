package main

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/loyahub/indexer/pkg/api"
	"github.com/loyahub/indexer/pkg/blockchain"
	"github.com/loyahub/indexer/pkg/config"
	"github.com/loyahub/indexer/pkg/db"
	"github.com/loyahub/indexer/pkg/queue"
)

var (
	logger *zap.Logger
	wg     sync.WaitGroup
)

func main() {
	// Configurar logger
	logger, _ = zap.NewProduction()
	defer logger.Sync()

	// Carregar configurações
	cfg := config.LoadConfig()
	logger.Info("Configurações carregadas", zap.String("rpc_url", cfg.RPCURL))

	// Contexto principal
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Conectar ao banco de dados
	dbPool, err := db.Connect(ctx)
	if err != nil {
		logger.Fatal("Falha ao conectar ao banco de dados", zap.Error(err))
	}
	defer db.Close()

	// Inicializar esquema do banco de dados
	if err := db.InitSchema(ctx); err != nil {
		logger.Fatal("Falha ao inicializar esquema do banco de dados", zap.Error(err))
	}

	// Conectar ao blockchain
	if err := blockchain.Connect(); err != nil {
		logger.Fatal("Falha ao conectar ao blockchain", zap.Error(err))
	}
	defer blockchain.Close()

	// Conectar ao RabbitMQ
	if err := queue.Connect(); err != nil {
		logger.Fatal("Falha ao conectar ao RabbitMQ", zap.Error(err))
	}
	defer queue.Close()

	// Configurar API REST
	api.SetupRouter(dbPool)

	// Iniciar componentes
	wg.Add(3) // API, Block Indexer, Event Processor

	// Iniciar API REST em goroutine
	go func() {
		defer wg.Done()

		if err := api.StartServer(); err != nil {
			logger.Error("Falha ao iniciar servidor API REST", zap.Error(err))
		}
	}()

	// Iniciar Block Indexer em goroutine
	go func() {
		defer wg.Done()
		runBlockIndexer(ctx)
	}()

	// Iniciar Event Processor em goroutine
	go func() {
		defer wg.Done()
		runEventProcessor(ctx)
	}()

	// Capturar sinais de encerramento
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)

	// Aguardar sinal
	<-signalChan
	logger.Info("Sinal de encerramento recebido, encerrando...")

	// Criar um contexto com timeout para encerramento gracioso
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	// Encerrar componentes
	if err := api.StopServer(shutdownCtx); err != nil {
		logger.Error("Erro ao encerrar servidor API REST", zap.Error(err))
	}

	// Cancelar o contexto principal, o que deve sinalizar para as goroutines encerrarem
	cancel()

	// Aguardar goroutines finalizarem (com um timeout)
	waitChan := make(chan struct{})
	go func() {
		wg.Wait()
		close(waitChan)
	}()

	select {
	case <-waitChan:
		logger.Info("Todos os componentes encerrados com sucesso")
	case <-time.After(15 * time.Second):
		logger.Warn("Timeout ao aguardar componentes encerrarem, forçando saída")
	}

	logger.Info("Aplicação encerrada")
}

// runBlockIndexer verifica blocos novos e atualiza o banco de dados
func runBlockIndexer(ctx context.Context) {
	logger.Info("Iniciando Block Indexer")

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info("Block Indexer encerrado")
			return
		case <-ticker.C:
			processNewBlocks(ctx)
		}
	}
}

// processNewBlocks processa novos blocos de todos os tokens registrados
func processNewBlocks(ctx context.Context) {
	// Obter lista de tokens registrados
	pool := db.GetPool()
	if pool == nil {
		logger.Error("Conexão com banco de dados não disponível")
		return
	}

	rows, err := pool.Query(ctx, `
		SELECT t.address, COALESCE(s.last_block_number, 0) as last_block
		FROM tokens t
		LEFT JOIN sync_state s ON t.address = s.token_address
	`)
	if err != nil {
		logger.Error("Falha ao obter tokens para sincronização", zap.Error(err))
		return
	}
	defer rows.Close()

	// Para cada token, enviar mensagem para processamento dos blocos
	for rows.Next() {
		var tokenAddress string
		var lastBlockNumber uint64

		if err := rows.Scan(&tokenAddress, &lastBlockNumber); err != nil {
			logger.Error("Falha ao ler dados do token", zap.Error(err))
			continue
		}

		// Obter número do bloco atual
		currentBlock, err := blockchain.GetCurrentBlock(ctx)
		if err != nil {
			logger.Error("Falha ao obter bloco atual", zap.Error(err))
			continue
		}

		// Calcular próximo bloco a ser processado
		nextBlock := lastBlockNumber + 1
		if nextBlock > currentBlock {
			continue // Token já está atualizado
		}

		// Limite de blocos por iteração
		batchSize := config.Get().BlocksPerBatch
		endBlock := nextBlock + uint64(batchSize) - 1
		if endBlock > currentBlock {
			endBlock = currentBlock
		}

		logger.Info("Enviando blocos para processamento",
			zap.String("token", tokenAddress),
			zap.Uint64("from", nextBlock),
			zap.Uint64("to", endBlock),
		)

		// Publicar mensagem na fila
		err = queue.PublishBlockMessage(ctx, queue.BlockMessage{
			BlockNumber: nextBlock,
			TokenAddr:   tokenAddress,
		})
		if err != nil {
			logger.Error("Falha ao enviar mensagem para processamento de bloco",
				zap.Error(err),
				zap.String("token", tokenAddress),
			)
		}
	}
}

// runEventProcessor processa eventos da fila
func runEventProcessor(ctx context.Context) {
	logger.Info("Iniciando Event Processor")

	// Consumir mensagens da fila de blocos
	blockMsgs, err := queue.ConsumeQueue(queue.QueueBlocks, false)
	if err != nil {
		logger.Error("Falha ao consumir fila de blocos", zap.Error(err))
		return
	}

	for {
		select {
		case <-ctx.Done():
			logger.Info("Event Processor encerrado")
			return
		case delivery, ok := <-blockMsgs:
			if !ok {
				logger.Warn("Canal de mensagens de blocos fechado")
				return
			}

			// Processar mensagem
			var msg queue.BlockMessage
			// Deserializar, processar e manipular erros
			// Implementação fictícia aqui
			logger.Info("Processando bloco", zap.String("token", msg.TokenAddr), zap.Uint64("block", msg.BlockNumber))

			// Confirmar mensagem
			if err := delivery.Ack(false); err != nil {
				logger.Error("Falha ao confirmar mensagem", zap.Error(err))
			}
		}
	}
}
