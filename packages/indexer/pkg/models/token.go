package models

import (
	"math/big"
	"time"
)

// Token representa informações básicas de um token ERC20
type Token struct {
	Address     string    `json:"address"`
	Name        string    `json:"name"`
	Symbol      string    `json:"symbol"`
	Decimals    uint8     `json:"decimals"`
	TotalSupply *big.Int  `json:"total_supply"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Transfer representa um evento de transferência ERC20
type Transfer struct {
	ID              string    `json:"id"`
	TokenAddress    string    `json:"token_address"`
	From            string    `json:"from"`
	To              string    `json:"to"`
	Value           *big.Int  `json:"value"`
	TransactionHash string    `json:"transaction_hash"`
	BlockNumber     uint64    `json:"block_number"`
	BlockHash       string    `json:"block_hash"`
	LogIndex        uint      `json:"log_index"`
	Timestamp       time.Time `json:"timestamp"`
}

// Approval representa um evento de aprovação ERC20
type Approval struct {
	ID              string    `json:"id"`
	TokenAddress    string    `json:"token_address"`
	Owner           string    `json:"owner"`
	Spender         string    `json:"spender"`
	Value           *big.Int  `json:"value"`
	TransactionHash string    `json:"transaction_hash"`
	BlockNumber     uint64    `json:"block_number"`
	BlockHash       string    `json:"block_hash"`
	LogIndex        uint      `json:"log_index"`
	Timestamp       time.Time `json:"timestamp"`
}

// Balance representa o saldo de um token para um endereço
type Balance struct {
	ID           string    `json:"id"`
	TokenAddress string    `json:"token_address"`
	Owner        string    `json:"owner"`
	Value        *big.Int  `json:"value"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// SyncState armazena o estado de sincronização por token
type SyncState struct {
	TokenAddress    string    `json:"token_address"`
	LastBlockNumber uint64    `json:"last_block_number"`
	UpdatedAt       time.Time `json:"updated_at"`
}
