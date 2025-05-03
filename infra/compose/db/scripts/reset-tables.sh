#!/bin/bash

# Script para resetar tabelas específicas no banco de dados
# Reseta customer, metadata e user_entity

echo "🔄 Resetando tabelas do banco de dados..."

# Variáveis do banco de dados
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-loyahub_db}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-loyahub}

# Executa os comandos SQL para truncar as tabelas
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
TRUNCATE TABLE public.customer RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.metadata RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_entity RESTART IDENTITY CASCADE;
EOF

# Verifica se o comando foi bem-sucedido
if [ $? -eq 0 ]; then
  echo "✅ Tabelas resetadas com sucesso!"
else
  echo "❌ Erro ao resetar tabelas. Verifique se o banco de dados está acessível."
  exit 1
fi
