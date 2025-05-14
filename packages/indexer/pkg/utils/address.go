package utils

import (
	"regexp"
	"strings"

	"github.com/ethereum/go-ethereum/common"
)

var (
	addressRegex = regexp.MustCompile("^0x[0-9a-fA-F]{40}$")
)

// IsValidAddress verifica se um endereço Ethereum é válido
func IsValidAddress(address string) bool {
	return addressRegex.MatchString(address)
}

// NormalizeAddress padroniza um endereço Ethereum
func NormalizeAddress(address string) string {
	// Garantir que tem o prefixo 0x
	if !strings.HasPrefix(address, "0x") {
		address = "0x" + address
	}

	// Converter para checksum address
	return common.HexToAddress(address).Hex()
}

// CreateIDFromTransfer cria um ID único para uma transferência
func CreateIDFromTransfer(txHash string, logIndex uint) string {
	return strings.ToLower(txHash) + "-" + string(logIndex)
}

// AddressesEqual verifica se dois endereços são iguais, ignorando caixa
func AddressesEqual(addr1, addr2 string) bool {
	return strings.EqualFold(addr1, addr2)
}

// ZeroAddress retorna o endereço zero
func ZeroAddress() string {
	return "0x0000000000000000000000000000000000000000"
}

// IsZeroAddress verifica se é o endereço zero
func IsZeroAddress(address string) bool {
	return AddressesEqual(address, ZeroAddress())
}
