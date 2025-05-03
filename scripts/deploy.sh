#!/bin/bash

# Script de deploy completo do projeto LoyaHub

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para executar comando e verificar erros
run_command() {
  echo -e "${YELLOW}$1${NC}"
  if $2; then
    echo -e "${GREEN}✓ $3${NC}"
    return 0
  else
    echo -e "${RED}✗ $4${NC}"
    if [ "$5" = "exit" ]; then
      exit 1
    fi
    return 1
  fi
}

# Passo 1: Reset das tabelas do banco de dados
echo -e "\n${YELLOW}1. Resetando tabelas do banco de dados...${NC}"
cd infra/compose/db/scripts
chmod +x reset-tables.sh
if ./reset-tables.sh; then
  echo -e "${GREEN}✓ Reset das tabelas concluído com sucesso!${NC}"
else
  echo -e "${RED}✗ Erro ao resetar tabelas. Continuando mesmo assim...${NC}"
fi

# Voltar para a raiz do projeto
cd ../../../

# Passo 2: Deploy do contrato Drex
echo -e "\n${YELLOW}2. Iniciando deploy do contrato Drex...${NC}"
if pnpm sc:deploy:drex; then
  echo -e "${GREEN}✓ Deploy do Drex concluído com sucesso!${NC}"
else
  echo -e "${RED}✗ Erro ao executar o deploy do Drex.${NC}"
  echo -e "${RED}Interrompendo o processo de deploy.${NC}"
  exit 1
fi

# Passo 3: Deploy do contrato ClientCore
echo -e "\n${YELLOW}3. Iniciando deploy do contrato ClientCore...${NC}"
if pnpm sc:deploy:client:core; then
  echo -e "${GREEN}✓ Deploy do ClientCore concluído com sucesso!${NC}"
else
  echo -e "${RED}✗ Erro ao executar o deploy do ClientCore.${NC}"
  echo -e "${RED}Interrompendo o processo de deploy.${NC}"
  exit 1
fi

# Passo 4: Deploy do contrato PointsCore
echo -e "\n${YELLOW}4. Iniciando deploy do contrato PointsCore...${NC}"
if pnpm sc:deploy:points:core; then
  echo -e "${GREEN}✓ Deploy do PointsCore concluído com sucesso!${NC}"
else
  echo -e "${RED}✗ Erro ao executar o deploy do PointsCore.${NC}"
  echo -e "${RED}Interrompendo o processo de deploy.${NC}"
  exit 1
fi

# Conclusão
echo -e "\n${GREEN}Todos os contratos foram deployados com sucesso!${NC}"
echo -e "${GREEN}O ambiente está pronto para uso.${NC}"



