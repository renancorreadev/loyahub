package blockchain

import (
	"context"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"go.uber.org/zap"

	"github.com/loyahub/indexer/pkg/abis"
	"github.com/loyahub/indexer/pkg/config"
	"github.com/loyahub/indexer/pkg/models"
)

var (
	httpClient *ethclient.Client
	wsClient   *ethclient.Client
	parsedABI  abi.ABI
	logger     *zap.Logger
)

// Eventos ERC20 padrão
var (
	TransferTopic    common.Hash
	ApprovalTopic    common.Hash
	TransferBatchSig string
	ApprovalSig      string
)

// Métodos ERC20 padrão
const (
	NameFunc        = "name"
	SymbolFunc      = "symbol"
	DecimalsFunc    = "decimals"
	TotalSupplyFunc = "totalSupply"
	BalanceOfFunc   = "balanceOf"
)

// Inicializa os clientes e parsers
func init() {
	var err error
	logger, _ = zap.NewProduction()

	// Parse da ABI do ERC20
	parsedABI, err = abi.JSON(strings.NewReader(abis.ERC20ABI))
	if err != nil {
		logger.Fatal("Falha ao fazer o parse da ABI ERC20", zap.Error(err))
	}

	// Calcular assinaturas de eventos
	TransferTopic = common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")
	ApprovalTopic = common.HexToHash("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925")

	// Outras assinaturas
	TransferBatchSig = "Transfer(address,address,uint256)"
	ApprovalSig = "Approval(address,address,uint256)"
}

// Connect inicializa as conexões com os clientes HTTP e WebSocket
func Connect() error {
	cfg := config.Get()
	var err error

	// Inicializa cliente HTTP
	httpClient, err = ethclient.Dial(cfg.RPCURL)
	if err != nil {
		logger.Error("Falha ao conectar ao cliente RPC", zap.Error(err))
		return err
	}

	// Inicializa cliente WebSocket se disponível
	if cfg.WSURL != "" {
		wsClient, err = ethclient.Dial(cfg.WSURL)
		if err != nil {
			logger.Error("Falha ao conectar ao cliente WebSocket", zap.Error(err))
			// Continua mesmo sem WebSocket
		}
	}

	logger.Info("Conexão com a blockchain estabelecida com sucesso")
	return nil
}

// GetCurrentBlock retorna o número do bloco atual
func GetCurrentBlock(ctx context.Context) (uint64, error) {
	if httpClient == nil {
		return 0, ErrClientNotInitialized
	}

	blockNumber, err := httpClient.BlockNumber(ctx)
	if err != nil {
		logger.Error("Falha ao obter o número do bloco atual", zap.Error(err))
		return 0, err
	}

	return blockNumber, nil
}

// GetBlockByNumber retorna um bloco a partir do número
func GetBlockByNumber(ctx context.Context, number uint64) (*types.Block, error) {
	if httpClient == nil {
		return nil, ErrClientNotInitialized
	}

	block, err := httpClient.BlockByNumber(ctx, big.NewInt(int64(number)))
	if err != nil {
		logger.Error("Falha ao obter o bloco", zap.Uint64("blockNumber", number), zap.Error(err))
		return nil, err
	}

	return block, nil
}

// GetLogs recupera logs de eventos entre os blocos fromBlock e toBlock
func GetLogs(ctx context.Context, tokenAddress common.Address, fromBlock, toBlock uint64) ([]types.Log, error) {
	if httpClient == nil {
		return nil, ErrClientNotInitialized
	}

	// Cria filtro para eventos Transfer e Approval
	filterQuery := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(fromBlock)),
		ToBlock:   big.NewInt(int64(toBlock)),
		Addresses: []common.Address{tokenAddress},
		Topics: [][]common.Hash{
			{TransferTopic, ApprovalTopic},
		},
	}

	logs, err := httpClient.FilterLogs(ctx, filterQuery)
	if err != nil {
		logger.Error("Falha ao obter logs",
			zap.Uint64("fromBlock", fromBlock),
			zap.Uint64("toBlock", toBlock),
			zap.String("tokenAddress", tokenAddress.Hex()),
			zap.Error(err),
		)
		return nil, err
	}

	return logs, nil
}

// SubscribeToNewHeads registra para receber novos blocos
func SubscribeToNewHeads(ctx context.Context) (ethereum.Subscription, <-chan *types.Header, error) {
	if wsClient == nil {
		return nil, nil, ErrWSClientNotInitialized
	}

	headers := make(chan *types.Header)
	sub, err := wsClient.SubscribeNewHead(ctx, headers)
	if err != nil {
		logger.Error("Falha ao se inscrever para novos blocos", zap.Error(err))
		return nil, nil, err
	}

	return sub, headers, nil
}

// GetTokenInfo retorna informações básicas do token ERC20
func GetTokenInfo(ctx context.Context, tokenAddress common.Address) (*models.Token, error) {
	if httpClient == nil {
		return nil, ErrClientNotInitialized
	}

	token := &models.Token{
		Address: tokenAddress.Hex(),
	}

	// Nome
	nameBytes, err := httpClient.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddress,
		Data: parsedABI.Methods[NameFunc].ID,
	}, nil)
	if err == nil {
		name, err := parsedABI.Unpack(NameFunc, nameBytes)
		if err == nil && len(name) > 0 {
			token.Name = name[0].(string)
		}
	}

	// Símbolo
	symbolBytes, err := httpClient.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddress,
		Data: parsedABI.Methods[SymbolFunc].ID,
	}, nil)
	if err == nil {
		symbol, err := parsedABI.Unpack(SymbolFunc, symbolBytes)
		if err == nil && len(symbol) > 0 {
			token.Symbol = symbol[0].(string)
		}
	}

	// Decimais
	decimalsBytes, err := httpClient.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddress,
		Data: parsedABI.Methods[DecimalsFunc].ID,
	}, nil)
	if err == nil {
		decimals, err := parsedABI.Unpack(DecimalsFunc, decimalsBytes)
		if err == nil && len(decimals) > 0 {
			token.Decimals = uint8(decimals[0].(uint8))
		}
	}

	// Oferta total
	totalSupplyBytes, err := httpClient.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddress,
		Data: parsedABI.Methods[TotalSupplyFunc].ID,
	}, nil)
	if err == nil {
		totalSupply, err := parsedABI.Unpack(TotalSupplyFunc, totalSupplyBytes)
		if err == nil && len(totalSupply) > 0 {
			token.TotalSupply = totalSupply[0].(*big.Int)
		}
	}

	return token, nil
}

// GetBalance retorna o saldo de um endereço para um token ERC20
func GetBalance(ctx context.Context, tokenAddress, ownerAddress common.Address) (*big.Int, error) {
	if httpClient == nil {
		return nil, ErrClientNotInitialized
	}

	// Empacota a chamada para balanceOf
	data, err := parsedABI.Pack(BalanceOfFunc, ownerAddress)
	if err != nil {
		logger.Error("Falha ao empacotar chamada balanceOf", zap.Error(err))
		return nil, err
	}

	// Executa a chamada
	result, err := httpClient.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddress,
		Data: data,
	}, nil)
	if err != nil {
		logger.Error("Falha ao chamar balanceOf",
			zap.String("tokenAddress", tokenAddress.Hex()),
			zap.String("ownerAddress", ownerAddress.Hex()),
			zap.Error(err),
		)
		return nil, err
	}

	// Desempacota o resultado
	unpacked, err := parsedABI.Unpack(BalanceOfFunc, result)
	if err != nil {
		logger.Error("Falha ao desempacotar resultado balanceOf", zap.Error(err))
		return nil, err
	}

	if len(unpacked) == 0 {
		return big.NewInt(0), nil
	}

	return unpacked[0].(*big.Int), nil
}

// Close fecha as conexões com os clientes
func Close() {
	if httpClient != nil {
		httpClient.Close()
	}
	if wsClient != nil {
		wsClient.Close()
	}
}

// Erros
var (
	ErrClientNotInitialized   = WrapError("cliente RPC não inicializado")
	ErrWSClientNotInitialized = WrapError("cliente WebSocket não inicializado")
)

// WrapError cria um erro com contexto
func WrapError(msg string) error {
	return &Error{Message: msg}
}

// Error representa um erro do cliente blockchain
type Error struct {
	Message string
}

func (e *Error) Error() string {
	return e.Message
}
