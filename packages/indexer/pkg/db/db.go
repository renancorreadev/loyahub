package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/loyahub/indexer/pkg/config"
)

var pool *pgxpool.Pool

// Connect inicializa a conexão com o banco de dados PostgreSQL
func Connect(ctx context.Context) (*pgxpool.Pool, error) {
	if pool != nil {
		return pool, nil
	}

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Get()
	connString := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	var err error
	pool, err = pgxpool.New(ctx, connString)
	if err != nil {
		logger.Error("Falha ao conectar ao PostgreSQL", zap.Error(err))
		return nil, err
	}

	// Testar conexão
	if err = pool.Ping(ctx); err != nil {
		logger.Error("Falha ao ping no PostgreSQL", zap.Error(err))
		return nil, err
	}

	logger.Info("Conexão com PostgreSQL estabelecida com sucesso")
	return pool, nil
}

// GetPool retorna a conexão existente com o pool
func GetPool() *pgxpool.Pool {
	return pool
}

// InitSchema cria as tabelas necessárias se não existirem
func InitSchema(ctx context.Context) error {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	if pool == nil {
		return fmt.Errorf("conexão com o banco de dados não inicializada")
	}

	// Criação das tabelas
	schema := `
	-- Tokens ERC20
	CREATE TABLE IF NOT EXISTS tokens (
		address VARCHAR(42) PRIMARY KEY,
		name VARCHAR(255),
		symbol VARCHAR(50),
		decimals INTEGER,
		total_supply NUMERIC(78,0),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	-- Transferências
	CREATE TABLE IF NOT EXISTS transfers (
		id VARCHAR(66) PRIMARY KEY,
		token_address VARCHAR(42) REFERENCES tokens(address),
		from_address VARCHAR(42),
		to_address VARCHAR(42),
		value NUMERIC(78,0),
		transaction_hash VARCHAR(66),
		block_number BIGINT,
		block_hash VARCHAR(66),
		log_index INTEGER,
		timestamp TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	-- Aprovações
	CREATE TABLE IF NOT EXISTS approvals (
		id VARCHAR(66) PRIMARY KEY,
		token_address VARCHAR(42) REFERENCES tokens(address),
		owner VARCHAR(42),
		spender VARCHAR(42),
		value NUMERIC(78,0),
		transaction_hash VARCHAR(66),
		block_number BIGINT,
		block_hash VARCHAR(66),
		log_index INTEGER,
		timestamp TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	-- Saldos
	CREATE TABLE IF NOT EXISTS balances (
		id VARCHAR(85) PRIMARY KEY, -- combinação de token_address + owner
		token_address VARCHAR(42) REFERENCES tokens(address),
		owner VARCHAR(42),
		value NUMERIC(78,0),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	-- Estado de sincronização
	CREATE TABLE IF NOT EXISTS sync_state (
		token_address VARCHAR(42) PRIMARY KEY REFERENCES tokens(address),
		last_block_number BIGINT,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	-- Índices
	CREATE INDEX IF NOT EXISTS idx_transfers_token_address ON transfers(token_address);
	CREATE INDEX IF NOT EXISTS idx_transfers_from_address ON transfers(from_address);
	CREATE INDEX IF NOT EXISTS idx_transfers_to_address ON transfers(to_address);
	CREATE INDEX IF NOT EXISTS idx_transfers_block_number ON transfers(block_number);
	
	CREATE INDEX IF NOT EXISTS idx_approvals_token_address ON approvals(token_address);
	CREATE INDEX IF NOT EXISTS idx_approvals_owner ON approvals(owner);
	CREATE INDEX IF NOT EXISTS idx_approvals_spender ON approvals(spender);
	
	CREATE INDEX IF NOT EXISTS idx_balances_token_address ON balances(token_address);
	CREATE INDEX IF NOT EXISTS idx_balances_owner ON balances(owner);
	`

	_, err := pool.Exec(ctx, schema)
	if err != nil {
		logger.Error("Falha ao criar esquema", zap.Error(err))
		return err
	}

	logger.Info("Esquema criado com sucesso")
	return nil
}

// Close fecha a conexão com o banco de dados
func Close() {
	if pool != nil {
		pool.Close()
	}
}
