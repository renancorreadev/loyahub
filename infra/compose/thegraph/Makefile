# Makefile para gerenciamento do TheGraph
.PHONY: help setup start stop status restart reset clean logs deploy

# Variáveis
DOCKER_COMPOSE = docker-compose
GRAPH_SERVICE = graph-node
IPFS_SERVICE = ipfs
POSTGRES_SERVICE = postgres
DREX_DIR = ./drex

# Cores para output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "${YELLOW}Makefile para gerenciamento do TheGraph${NC}"
	@echo ""
	@echo "${GREEN}Comandos disponíveis:${NC}"
	@echo "  ${YELLOW}make setup${NC}        - Configura e implanta o subgraph"
	@echo "  ${YELLOW}make start${NC}        - Inicia os containers do TheGraph"
	@echo "  ${YELLOW}make stop${NC}         - Para os containers do TheGraph"
	@echo "  ${YELLOW}make status${NC}       - Verifica o status atual dos containers"
	@echo "  ${YELLOW}make restart${NC}      - Reinicia os containers do TheGraph"
	@echo "  ${YELLOW}make reset${NC}        - Reinicia o TheGraph e limpa os dados (⚠️ Cuidado!)"
	@echo "  ${YELLOW}make clean${NC}        - Para os containers e remove volumes (⚠️ Cuidado!)"
	@echo "  ${YELLOW}make logs${NC}         - Exibe os logs do graph-node"
	@echo "  ${YELLOW}make deploy${NC}       - Apenas implanta o subgraph sem iniciar containers"
	@echo ""
	@echo "${RED}⚠️  Atenção:${NC} Os comandos 'reset' e 'clean' removem todos os dados do TheGraph!"

setup:
	@echo "${GREEN}Configurando o TheGraph e implantando o subgraph...${NC}"
	@echo "${YELLOW}Iniciando containers necessários...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo "${YELLOW}Aguardando inicialização dos serviços...${NC}"
	@sleep 10
	@echo "${YELLOW}Entrando no diretório Drex e gerando código...${NC}"
	@cd $(DREX_DIR) && graph codegen
	@echo "${YELLOW}Executando script de inicialização...${NC}"
	@cd $(DREX_DIR) && bash init.sh
	@echo "${GREEN}Configuração concluída!${NC}"

start:
	@echo "${GREEN}Iniciando containers do TheGraph...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Containers iniciados.${NC}"

stop:
	@echo "${YELLOW}Parando containers do TheGraph...${NC}"
	@$(DOCKER_COMPOSE) stop
	@echo "${GREEN}Containers parados.${NC}"

status:
	@echo "${GREEN}Verificando status dos containers do TheGraph...${NC}"
	@$(DOCKER_COMPOSE) ps

restart:
	@echo "${YELLOW}Reiniciando containers do TheGraph...${NC}"
	@$(DOCKER_COMPOSE) restart
	@echo "${GREEN}Containers reiniciados.${NC}"

reset:
	@echo "${RED}⚠️ Atenção: Isso removerá TODOS os dados do TheGraph!${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	  [ $${confirm:-n} = "y" ] || exit 1
	@$(MAKE) clean
	@$(MAKE) setup
	@echo "${GREEN}TheGraph resetado e configurado novamente.${NC}"

clean:
	@echo "${RED}⚠️ Atenção: Isso removerá TODOS os dados do TheGraph!${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	  [ $${confirm:-n} = "y" ] || exit 1
	@echo "${YELLOW}Parando containers e removendo volumes...${NC}"
	@$(DOCKER_COMPOSE) down -v
	@echo "${GREEN}Limpeza concluída.${NC}"

logs:
	@echo "${GREEN}Exibindo logs do graph-node (Ctrl+C para sair)...${NC}"
	@$(DOCKER_COMPOSE) logs -f $(GRAPH_SERVICE)

deploy:
	@echo "${YELLOW}Implantando subgraph sem iniciar containers...${NC}"
	@cd $(DREX_DIR) && graph codegen
	@cd $(DREX_DIR) && bash init.sh
	@echo "${GREEN}Implantação concluída!${NC}" 