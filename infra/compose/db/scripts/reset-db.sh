#!/bin/bash
set -e

echo "🧹 Resetando completamente o PostgreSQL..."

# Determina o diretório onde o docker-compose.yml está localizado
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
DB_DIR="$(dirname "$SCRIPT_DIR")"

# Para os containers e remove volumes
echo "🗑️ Removendo container e volumes..."
cd "$DB_DIR"
docker-compose down -v

# Espera um momento para garantir que tudo foi limpo
sleep 2

echo "✅ PostgreSQL resetado com sucesso. Agora execute o setup-db.sh para reconfigurar." 