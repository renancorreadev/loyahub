#!/bin/bash
set -e

echo "🚀 Iniciando configuração do Vault para o LoyaHub Wallet Engine..."

# Verifica se o usuário quer fazer um reset completo
if [ "$1" == "--reset" ]; then
  echo "🧹 Limpando ambiente anterior..."
  docker-compose down 2>/dev/null || true
  rm -rf ./data
  mkdir -p ./data
  RESET_COMPLETE=true
else
  mkdir -p ./data
  RESET_COMPLETE=false
fi

# Cria o arquivo de configuração do Vault se não existir
if [ ! -f "./data/vault-config.json" ] || [ "$RESET_COMPLETE" == "true" ]; then
  echo "📝 Criando arquivo de configuração do Vault..."
  cat > ./data/vault-config.json << EOF
{
  "storage": {
    "file": {
      "path": "/vault/data"
    }
  },
  "listener": {
    "tcp": {
      "address": "0.0.0.0:8200",
      "tls_disable": 1
    }
  },
  "ui": true,
  "disable_mlock": true
}
EOF
fi

# Função para verificar se o Vault está respondendo
wait_for_vault() {
  local max_attempts=30
  local attempt=1
  
  echo "⏳ Aguardando o Vault iniciar..."
  while [ $attempt -le $max_attempts ]; do
    echo "Tentativa $attempt de $max_attempts..."
    
    # Primeiro verifica se o container está rodando
    if ! docker ps | grep -q vault; then
      echo "❌ Container do Vault não está rodando!"
      return 1
    fi
    
    # Verifica se o serviço está respondendo via HTTP
    local http_status
    http_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8200/v1/sys/health 2>/dev/null || echo "000")
    
    # Status 501 indica que o Vault não está inicializado, mas está pronto para aceitar comandos
    # Status 200 indica que está inicializado e não selado
    # Status 429 indica que está inicializado mas selado
    if [ "$http_status" = "501" ] || [ "$http_status" = "200" ] || [ "$http_status" = "429" ]; then
      echo "✅ Vault está pronto para aceitar comandos (status: $http_status)"
      return 0
    fi
    
    echo "Aguardando Vault iniciar (status: $http_status)..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "❌ Timeout aguardando o Vault iniciar"
  return 1
}

# Função para verificar status do Vault com retry
check_vault_status() {
  local max_attempts=10
  local attempt=1
  local status_output=""
  
  while [ $attempt -le $max_attempts ]; do
    echo "Verificando status do Vault (tentativa $attempt de $max_attempts)..."
    
    # Tenta obter o status e redireciona stderr para stdout para capturar mensagens de erro
    if status_output=$(docker exec vault vault status -format=json 2>&1); then
      # Verifica se a saída é um JSON válido
      if echo "$status_output" | grep -q '"initialized"'; then
        echo "$status_output"
        return 0
      fi
    fi
    
    # Se chegou aqui, houve erro ou saída inválida
    echo "Aguardando Vault estar pronto..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  # Se todas as tentativas falharam, mostra os logs
  echo "❌ Não foi possível obter o status do Vault após $max_attempts tentativas"
  echo "📋 Últimas linhas do log:"
  docker logs vault --tail 20
  return 1
}

# Inicia o container do Vault
echo "🐳 Iniciando container do Vault..."
docker-compose up -d

# Espera o serviço estar respondendo
echo "⏳ Aguardando o serviço iniciar..."
sleep 5

# Inicializa o Vault se necessário
initialize_vault() {
  echo "🔐 Inicializando o Vault..."
  if INIT_OUTPUT=$(docker exec vault vault operator init -key-shares=1 -key-threshold=1 2>/dev/null); then
    echo "$INIT_OUTPUT" > ./data/vault-init.txt
    
    # Extrai as chaves e tokens
    UNSEAL_KEY=$(echo "$INIT_OUTPUT" | grep "Unseal Key 1" | awk '{print $NF}')
    ROOT_TOKEN=$(echo "$INIT_OUTPUT" | grep "Root Token" | awk '{print $NF}')
    
    echo "✅ Vault inicializado com sucesso!"
    echo "🔑 Chave de desbloqueio: $UNSEAL_KEY"
    echo "🎫 Token Root: $ROOT_TOKEN"
    
    # Salva os segredos em .env
    cat > .env << EOF
# Segredos do Vault - Gerado automaticamente
VAULT_ADDR=http://localhost:8200
VAULT_ENDPOINT=http://localhost:8200
VAULT_ROOT_TOKEN=$ROOT_TOKEN
VAULT_UNSEAL_KEY=$UNSEAL_KEY
EOF
    
    return 0
  else
    echo "❌ Erro ao inicializar o Vault"
    return 1
  fi
}

# Desbloqueio do Vault
unseal_vault() {
  local UNSEAL_KEY=$1
  echo "🔓 Desbloqueando o Vault..."
  if docker exec vault vault operator unseal "$UNSEAL_KEY"; then
    echo "✅ Vault desbloqueado com sucesso!"
    return 0
  else
    echo "❌ Erro ao desbloquear o Vault"
    return 1
  fi
}

# Verifica se o Vault já está inicializado
INIT_STATUS=$(curl -s http://localhost:8200/v1/sys/init | grep -o '"initialized":[^,}]*' | cut -d ":" -f2 | tr -d ' ')

if [ "$INIT_STATUS" = "false" ] || [ "$RESET_COMPLETE" = "true" ]; then
  # Inicializa o Vault
  if ! initialize_vault; then
    echo "❌ Falha ao inicializar o Vault"
    exit 1
  fi
  
  # Carrega as credenciais recém-criadas
  source .env
  
  # Desbloqueia o Vault
  if ! unseal_vault "$VAULT_UNSEAL_KEY"; then
    echo "❌ Falha ao desbloquear o Vault"
    exit 1
  fi
  
  # Login com o token root
  echo "🔑 Fazendo login no Vault..."
  if ! docker exec vault vault login "$VAULT_ROOT_TOKEN"; then
    echo "❌ Falha ao fazer login no Vault"
    exit 1
  fi
  
  # Configurando o Secret Engine
  echo "⚙️ Configurando Secret Engine (KV Version 2)..."
  docker exec vault vault secrets enable -path=secret kv-v2 || echo "Secret engine já habilitado"
  
  # Cria uma política para o serviço
  echo "📜 Criando política para o serviço wallet..."
  cat > ./data/wallet-policy.hcl << EOF
# Política para o serviço wallet
path "secret/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/metadata/*" {
  capabilities = ["list"]
}
EOF
  
  docker exec -i vault vault policy write wallet-service - < ./data/wallet-policy.hcl
  
  # Cria um token de serviço
  echo "🔖 Criando token para o serviço..."
  SERVICE_TOKEN_OUTPUT=$(docker exec vault vault token create -policy=wallet-service)
  SERVICE_TOKEN=$(echo "$SERVICE_TOKEN_OUTPUT" | grep "token " | awk '{print $2}')
  
  # Adiciona o token de serviço ao .env
  echo "VAULT_TOKEN=$SERVICE_TOKEN" >> .env
  echo "$SERVICE_TOKEN" > ./data/service-token.txt
  
  # Teste de conexão
  echo "🧪 Testando a conexão..."
  if ! docker exec vault vault kv put secret/test test_key=teste_ok; then
    echo "❌ Erro ao testar a conexão"
    exit 1
  fi
  
else
  echo "ℹ️ Vault já está inicializado, carregando configuração existente..."
  
  if [ -f "./data/vault-init.txt" ]; then
    echo "📄 Usando credenciais salvas..."
    UNSEAL_KEY=$(grep "Unseal Key 1" ./data/vault-init.txt | awk '{print $NF}')
    ROOT_TOKEN=$(grep "Root Token" ./data/vault-init.txt | awk '{print $NF}')
    
    # Verifica se precisa desbloquear
    SEAL_STATUS=$(curl -s http://localhost:8200/v1/sys/seal-status | grep -o '"sealed":[^,}]*' | cut -d ":" -f2 | tr -d ' ')
    if [ "$SEAL_STATUS" = "true" ]; then
      if ! unseal_vault "$UNSEAL_KEY"; then
        echo "❌ Falha ao desbloquear o Vault"
        exit 1
      fi
    fi
  else
    echo "❌ Não foi possível encontrar as credenciais do Vault"
    exit 1
  fi
fi

echo ""
echo "✨ Vault configurado com sucesso!"
echo ""
echo "🔐 Credenciais disponíveis no arquivo .env:"
echo "  - VAULT_ADDR: http://localhost:8200"
echo "  - VAULT_ENDPOINT: http://localhost:8200"
echo "  - VAULT_ROOT_TOKEN: $ROOT_TOKEN"
echo "  - VAULT_UNSEAL_KEY: $UNSEAL_KEY"
if [ -f ".env" ] && grep -q VAULT_TOKEN .env; then
  VAULT_TOKEN=$(grep VAULT_TOKEN .env | cut -d= -f2)
  echo "  - VAULT_TOKEN: $VAULT_TOKEN (token do serviço wallet)"
fi
echo ""
echo "🌐 Acesse a UI do Vault em: http://localhost:8200"
echo "   Use o token root para login: $ROOT_TOKEN"
echo ""
echo "🔧 Para verificar o status do Vault:"
echo "   docker exec vault vault status"
echo ""
echo "🔁 Para reiniciar completamente o Vault:"
echo "   ./setup-vault.sh --reset"
echo ""
echo "⚠️ IMPORTANTE: Mantenha o arquivo .env e diretório data/ seguros!" 