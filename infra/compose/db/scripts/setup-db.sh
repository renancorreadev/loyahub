#!/bin/bash
set -e

echo "🚀 Iniciando configuração do PostgreSQL para o LoyaHub..."

# Determina o diretório onde o docker-compose.yml está localizado
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
DB_DIR="$(dirname "$SCRIPT_DIR")"

# Criar apenas arquivo .env.local com configurações básicas
echo "📝 Criando arquivo .env.local..."
cat > "$DB_DIR/.env.local" << ENVFILE
# Configurações do PostgreSQL
POSTGRES_USER=root
POSTGRES_PASSWORD=@stro119
POSTGRES_DB=loyahub_db
POSTGRES_HOST_AUTH_METHOD=trust
PGDATA=/var/lib/postgresql/data/pgdata
ENVFILE

# Inicia o container com volume Docker gerenciado
echo "🐳 Iniciando container do PostgreSQL..."
cd "$DB_DIR"
docker-compose down -v 2>/dev/null || true
docker-compose up -d

# Espera o container iniciar
echo "⏳ Aguardando o PostgreSQL iniciar..."
sleep 10

# Verifica se o PostgreSQL está respondendo
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker exec loyahub_db pg_isready -h localhost > /dev/null 2>&1; then
    echo "✅ PostgreSQL está pronto!"
    break
  else
    attempt=$((attempt+1))
    echo "⏳ Tentativa $attempt/$max_attempts: Aguardando PostgreSQL iniciar..."
    sleep 2
  fi
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ PostgreSQL não iniciou corretamente. Verificando logs:"
  docker logs loyahub_db
  exit 1
fi

# Cria o usuário loyahub para a aplicação
echo "👤 Criando usuário loyahub para a aplicação..."
docker exec -i loyahub_db psql -U root -d loyahub_db -c "CREATE ROLE loyahub WITH LOGIN PASSWORD '@stro119' SUPERUSER;" || echo "Usuário loyahub já pode existir"

# Tenta listar os bancos de dados para verificar se está funcionando
echo "🔍 Verificando informações do banco de dados:"
docker exec -i loyahub_db psql -U root -d loyahub_db -c "\l" || echo "⚠️ Não foi possível listar os bancos de dados"

echo "✨ PostgreSQL configurado com sucesso!"
echo ""
echo "🔐 Credenciais configuradas:"
echo "  - HOST: localhost"
echo "  - PORTA: 5432"
echo "  - USUÁRIO ADMIN: root"
echo "  - USUÁRIO APP: loyahub"
echo "  - SENHA: @stro119"
echo "  - BANCO: loyahub_db"
echo ""
echo "🔧 Para se conectar ao banco de dados como admin:"
echo "  docker exec -it loyahub_db psql -U root -d loyahub_db"
echo ""
echo "🔧 Para se conectar ao banco de dados como aplicação:"
echo "  docker exec -it loyahub_db psql -U loyahub -d loyahub_db" 