#!/bin/bash
set -e

echo "🧹 Resetando completamente o Vault..."

# Para os containers
docker-compose down

# Remove todos os arquivos de dados do Vault
rm -rf ./data

# Recria o diretório de dados
mkdir -p ./data

echo "✅ Vault resetado com sucesso. Agora execute o setup-vault.sh para reconfigurar." 