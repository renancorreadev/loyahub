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
  # Preserva os dados se não foi solicitado reset
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

# Inicia o container do Vault
echo "🐳 Iniciando container do Vault..."
docker-compose up -d

# Espera o serviço iniciar
echo "⏳ Aguardando o serviço iniciar..."
sleep 5

# Verifica status inicial do Vault
VAULT_STATUS=$(docker exec vault vault status -format=json 2>/dev/null || echo '{"initialized": false, "sealed": true}')
INITIALIZED=$(echo $VAULT_STATUS | grep -o '"initialized":[^,}]*' | cut -d ":" -f2 | tr -d ' ')
SEALED=$(echo $VAULT_STATUS | grep -o '"sealed":[^,}]*' | cut -d ":" -f2 | tr -d ' ')

echo "Status do Vault: Inicializado=$INITIALIZED, Selado=$SEALED"

# Se o Vault não estiver inicializado, inicializa-o
if [ "$INITIALIZED" != "true" ] || [ "$RESET_COMPLETE" == "true" ]; then
  echo "🔐 Inicializando o Vault..."
  INIT_OUTPUT=$(docker exec vault vault operator init -key-shares=1 -key-threshold=1)
  echo "$INIT_OUTPUT" > ./data/vault-init.txt

  # Extrai as chaves e tokens do resultado da inicialização
  UNSEAL_KEY=$(echo "$INIT_OUTPUT" | grep "Unseal Key 1" | awk '{print $NF}')
  ROOT_TOKEN=$(echo "$INIT_OUTPUT" | grep "Root Token" | awk '{print $NF}')

  echo "Chave de desbloqueio: $UNSEAL_KEY"
  echo "Token Root: $ROOT_TOKEN"

  # Salva os segredos em .env
  cat > .env << EOF
# Segredos do Vault - Gerado automaticamente
VAULT_ADDR=http://localhost:8200
VAULT_ENDPOINT=http://localhost:8200
VAULT_ROOT_TOKEN=$ROOT_TOKEN
VAULT_UNSEAL_KEY=$UNSEAL_KEY
EOF

  # Desbloqueio do Vault
  echo "🔑 Desbloqueando o Vault..."
  docker exec vault vault operator unseal "$UNSEAL_KEY"

  # Login com o token root
  echo "🔑 Fazendo login no Vault..."
  docker exec vault vault login "$ROOT_TOKEN"

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
  cat >> .env << EOF
VAULT_TOKEN=$SERVICE_TOKEN
EOF

  echo "$SERVICE_TOKEN" > ./data/service-token.txt

  # Teste de conexão com o secret engine
  echo "🧪 Testando a conexão com o secret engine..."
  docker exec vault vault kv put secret/test test_key=teste_ok

else
  # O Vault já está inicializado
  echo "ℹ️ O Vault já está inicializado."
  
  # Verifica se temos as credenciais salvas
  if [ -f "./data/vault-init.txt" ]; then
    echo "📄 Usando credenciais salvas..."
    UNSEAL_KEY=$(cat ./data/vault-init.txt | grep "Unseal Key 1" | awk '{print $NF}')
    ROOT_TOKEN=$(cat ./data/vault-init.txt | grep "Root Token" | awk '{print $NF}')
  else
    echo "⚠️ O Vault está inicializado mas não encontramos as credenciais salvas."
    read -p "Digite o token root do Vault: " ROOT_TOKEN
    read -p "Digite a chave de desbloqueio: " UNSEAL_KEY
  fi
  
  # Se estiver selado, desbloqueie
  if [ "$SEALED" == "true" ]; then
    echo "🔑 Desbloqueando o Vault..."
    docker exec vault vault operator unseal "$UNSEAL_KEY"
  fi
  
  # Login com o token root
  echo "🔑 Fazendo login no Vault..."
  docker exec vault vault login "$ROOT_TOKEN"
  
  # Verifica se o token de serviço existe em .env
  if [ ! -f ".env" ]; then
    echo "🔖 Criando token para o serviço..."
    SERVICE_TOKEN_OUTPUT=$(docker exec vault vault token create -policy=wallet-service)
    SERVICE_TOKEN=$(echo "$SERVICE_TOKEN_OUTPUT" | grep "token " | awk '{print $2}')
    
    # Cria o arquivo .env
    cat > .env << EOF
# Segredos do Vault - Gerado automaticamente
VAULT_ADDR=http://localhost:8200
VAULT_ENDPOINT=http://localhost:8200
VAULT_ROOT_TOKEN=$ROOT_TOKEN
VAULT_UNSEAL_KEY=$UNSEAL_KEY
VAULT_TOKEN=$SERVICE_TOKEN
EOF
    
    echo "$SERVICE_TOKEN" > ./data/service-token.txt
  else
    # Carrega o token de serviço do .env
    SERVICE_TOKEN=$(grep VAULT_TOKEN .env | cut -d= -f2)
  fi
  
  echo "✅ Vault já está configurado e pronto para uso."
fi

# Resumo da configuração
echo ""
echo "✨ Vault configurado com sucesso!"
echo ""
echo "🔐 Credenciais disponíveis no arquivo .env:"
echo "  - VAULT_ADDR: http://localhost:8200"
echo "  - VAULT_ENDPOINT: http://localhost:8200" 
echo "  - VAULT_ROOT_TOKEN: $ROOT_TOKEN"
echo "  - VAULT_UNSEAL_KEY: $UNSEAL_KEY"
echo "  - VAULT_TOKEN: $SERVICE_TOKEN (token do serviço wallet)"
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