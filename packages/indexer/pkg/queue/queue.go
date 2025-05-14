package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"

	"github.com/loyahub/indexer/pkg/config"
)

// Filas
const (
	QueueBlocks    = "blocks"
	QueueTokens    = "tokens"
	QueueTransfers = "transfers"
	QueueApprovals = "approvals"
	QueueBalances  = "balances"
)

// Estruturas para mensagens
type BlockMessage struct {
	BlockNumber uint64 `json:"block_number"`
	BlockHash   string `json:"block_hash"`
	TokenAddr   string `json:"token_address"`
	Timestamp   int64  `json:"timestamp"`
}

type TokenMessage struct {
	Address    string `json:"address"`
	IsNewToken bool   `json:"is_new_token"`
	Priority   int    `json:"priority"`
}

type EventMessage struct {
	TokenAddr       string `json:"token_address"`
	BlockNumber     uint64 `json:"block_number"`
	TransactionHash string `json:"transaction_hash"`
	LogIndex        uint   `json:"log_index"`
	Timestamp       int64  `json:"timestamp"`

	Raw json.RawMessage `json:"raw"`
}

var (
	conn    *amqp.Connection
	channel *amqp.Channel
	logger  *zap.Logger
)

// Connect estabelece conexão com o RabbitMQ
func Connect() error {
	logger, _ = zap.NewProduction()
	defer logger.Sync()

	cfg := config.Get()
	var err error

	// Conecta ao RabbitMQ
	conn, err = amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		logger.Error("Falha ao conectar ao RabbitMQ", zap.Error(err))
		return err
	}

	// Cria o canal
	channel, err = conn.Channel()
	if err != nil {
		logger.Error("Falha ao criar canal no RabbitMQ", zap.Error(err))
		conn.Close()
		return err
	}

	// Configura as filas com confirmação de entrega
	if err = channel.Confirm(false); err != nil {
		logger.Error("Falha ao configurar confirmações no canal RabbitMQ", zap.Error(err))
		channel.Close()
		conn.Close()
		return err
	}

	// Declaração das filas
	queues := []string{
		QueueBlocks,
		QueueTokens,
		QueueTransfers,
		QueueApprovals,
		QueueBalances,
	}

	for _, queueName := range queues {
		_, err = channel.QueueDeclare(
			queueName,
			true,  // durable
			false, // auto-delete
			false, // exclusive
			false, // no-wait
			nil,   // arguments
		)
		if err != nil {
			logger.Error("Falha ao declarar fila",
				zap.String("queue", queueName),
				zap.Error(err),
			)
			channel.Close()
			conn.Close()
			return err
		}
	}

	logger.Info("Conexão com RabbitMQ estabelecida com sucesso")
	return nil
}

// PublishBlockMessage publica uma mensagem na fila de blocos
func PublishBlockMessage(ctx context.Context, msg BlockMessage) error {
	return publish(ctx, QueueBlocks, msg)
}

// PublishTokenMessage publica uma mensagem na fila de tokens
func PublishTokenMessage(ctx context.Context, msg TokenMessage) error {
	return publish(ctx, QueueTokens, msg)
}

// PublishTransferMessage publica uma mensagem na fila de transferências
func PublishTransferMessage(ctx context.Context, msg EventMessage) error {
	return publish(ctx, QueueTransfers, msg)
}

// PublishApprovalMessage publica uma mensagem na fila de aprovações
func PublishApprovalMessage(ctx context.Context, msg EventMessage) error {
	return publish(ctx, QueueApprovals, msg)
}

// PublishBalanceMessage publica uma mensagem na fila de saldos
func PublishBalanceMessage(ctx context.Context, msg EventMessage) error {
	return publish(ctx, QueueBalances, msg)
}

// Função interna para publicar mensagens
func publish(ctx context.Context, queueName string, msg interface{}) error {
	if channel == nil {
		return fmt.Errorf("canal RabbitMQ não inicializado")
	}

	// Serializa a mensagem
	body, err := json.Marshal(msg)
	if err != nil {
		logger.Error("Falha ao serializar mensagem",
			zap.String("queue", queueName),
			zap.Error(err),
		)
		return err
	}

	// Publica a mensagem
	err = channel.PublishWithContext(
		ctx,
		"",        // exchange
		queueName, // routing key
		false,     // mandatory
		false,     // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Timestamp:    time.Now(),
			Body:         body,
		},
	)

	if err != nil {
		logger.Error("Falha ao publicar mensagem",
			zap.String("queue", queueName),
			zap.Error(err),
		)
		return err
	}

	return nil
}

// ConsumeQueue consome mensagens de uma fila
func ConsumeQueue(queueName string, autoAck bool) (<-chan amqp.Delivery, error) {
	if channel == nil {
		return nil, fmt.Errorf("canal RabbitMQ não inicializado")
	}

	// Configura consumidor
	return channel.Consume(
		queueName, // queue
		"",        // consumer
		autoAck,   // auto-ack
		false,     // exclusive
		false,     // no-local
		false,     // no-wait
		nil,       // args
	)
}

// Close fecha as conexões
func Close() {
	if channel != nil {
		channel.Close()
	}
	if conn != nil {
		conn.Close()
	}
}
