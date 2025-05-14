#!/bin/bash
set -e

echo "🧹 Resetando completamente o Vault..."

# Para os containers e remove volumes
echo "Parando containers..."
docker-compose down -v

# Remove todos os arquivos de dados do Vault
echo "Removendo arquivos de dados..."
rm -rf ./data
rm -f .env

# Recria o diretório de dados
echo "Recriando estrutura básica..."
mkdir -p ./data

echo "✅ Vault resetado com sucesso."
echo "⚡ Execute 'make setup' para reconfigurar o Vault." 