# =============================================================================
# Makefile para Gerenciamento do TheGraph
# Versão: 2.1.0
# =============================================================================

# Definição de variáveis
PROJECT_NAME := thegraph
GRAPH_SERVICE := graph-node
IPFS_SERVICE := ipfs
POSTGRES_SERVICE := postgres-graph
DREX_DIR := ./drex
MAX_RETRIES := 30
WAIT_TIME := 10
CURRENT_DIR := $(shell pwd)
DATE := $(shell date '+%Y-%m-%d_%H-%M-%S')
BACKUP_DIR := ./backups

# Comando docker-compose com verificação de versão
DOCKER_COMPOSE := docker-compose

# Portas dos serviços
GRAPH_PORT := 8000
IPFS_PORT := 5001
POSTGRES_PORT := 5433

# Cores e formatação
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
WHITE := \033[0;37m
BOLD := \033[1m
NC := \033[0m
CHECK_MARK := ✓
CROSS_MARK := ✖
ARROW := ➜
INFO := ℹ
WARNING := ⚠️

# Definição de alvos .PHONY
.PHONY: help setup start stop status restart reset clean logs deploy up down create-subgraph deploy-subgraph check-services wait-for-services backup restore healthcheck debug list-volumes list-networks

# Alvo padrão
.DEFAULT_GOAL := help

# =============================================================================
# Documentação e Ajuda
# =============================================================================

help:
	@echo "${WHITE}════════════════════════════════════════════════════════════════${NC}"
	@echo "${BOLD}🔍 Sistema TheGraph - Gerenciamento Completo v2.1.0${NC}"
	@echo "${WHITE}════════════════════════════════════════════════════════════════${NC}"
	@echo ""
	@echo "${BOLD}🚀 Comandos de Inicialização:${NC}"
	@echo "  ${YELLOW}make setup${NC}        - Configura e implanta o subgraph"
	@echo "  ${YELLOW}make start${NC}        - Inicia os containers do TheGraph"
	@echo "  ${YELLOW}make stop${NC}         - Para os containers do TheGraph"
	@echo ""
	@echo "${BOLD}📊 Monitoramento:${NC}"
	@echo "  ${YELLOW}make status${NC}       - Verifica o status atual dos containers"
	@echo "  ${YELLOW}make logs${NC}         - Exibe os logs do graph-node"
	@echo "  ${YELLOW}make healthcheck${NC}  - Verifica a saúde dos serviços"
	@echo ""
	@echo "${BOLD}🔄 Subgraph:${NC}"
	@echo "  ${YELLOW}make create-subgraph${NC} - Cria um novo subgraph"
	@echo "  ${YELLOW}make deploy-subgraph${NC} - Implanta um subgraph"
	@echo "  ${YELLOW}make deploy${NC}       - Apenas implanta o subgraph sem iniciar containers"
	@echo ""
	@echo "${BOLD}🔧 Manutenção:${NC}"
	@echo "  ${YELLOW}make restart${NC}      - Reinicia os containers do TheGraph"
	@echo "  ${YELLOW}make reset${NC}        - Reinicia o TheGraph e limpa os dados"
	@echo "  ${YELLOW}make clean${NC}        - Para os containers e remove volumes"
	@echo ""
	@echo "${BOLD}💾 Backup e Restore:${NC}"
	@echo "  ${YELLOW}make backup${NC}       - Realiza backup dos dados"
	@echo "  ${YELLOW}make restore${NC}      - Restaura backup dos dados"
	@echo ""
	@echo "${BOLD}🔍 Diagnóstico:${NC}"
	@echo "  ${YELLOW}make debug${NC}        - Mostra informações detalhadas para debug"
	@echo "  ${YELLOW}make list-volumes${NC} - Lista todos os volumes"
	@echo "  ${YELLOW}make list-networks${NC}- Lista todas as networks"
	@echo ""
	@echo "${RED}${WARNING} Atenção:${NC}"
	@echo "  - Os comandos 'reset' e 'clean' removem todos os dados!"
	@echo "  - Backups são armazenados em: ${BACKUP_DIR}"
	@echo ""
	@echo "${BOLD}URLs dos Serviços:${NC}"
	@echo "  - Graph Node: http://localhost:${GRAPH_PORT}"
	@echo "  - IPFS: http://localhost:${IPFS_PORT}"
	@echo "  - Postgres: localhost:${POSTGRES_PORT}"
	@echo "${WHITE}════════════════════════════════════════════════════════════════${NC}"

# =============================================================================
# Comandos Básicos
# =============================================================================

up: ## Inicia os containers
	@echo "${BLUE}${ARROW} Iniciando containers...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}${CHECK_MARK} Containers iniciados${NC}"
	@$(MAKE) healthcheck

down: ## Para os containers
	@echo "${BLUE}${ARROW} Parando containers...${NC}"
	@$(DOCKER_COMPOSE) down
	@echo "${GREEN}${CHECK_MARK} Containers parados${NC}"

start: up ## Alias para up
	@echo "${GREEN}${CHECK_MARK} Serviços iniciados${NC}"

stop: down ## Alias para down
	@echo "${GREEN}${CHECK_MARK} Serviços parados${NC}"

logs: ## Exibe logs dos containers
	@echo "${BLUE}${ARROW} Exibindo logs do graph-node...${NC}"
	@$(DOCKER_COMPOSE) logs -f $(GRAPH_SERVICE)

# =============================================================================
# Verificação de Ambiente
# =============================================================================

check-services:
	@echo "${BLUE}${ARROW} Verificando status dos serviços...${NC}"
	@$(DOCKER_COMPOSE) ps
	@echo "\n${BLUE}${ARROW} Logs do graph-node:${NC}"
	@$(DOCKER_COMPOSE) logs --tail=50 graph-node

wait-for-services:
	@echo "${YELLOW}${ARROW} Aguardando serviços estarem saudáveis...${NC}"
	@for i in $$(seq 1 $(MAX_RETRIES)); do \
		if curl -s http://localhost:8000 >/dev/null 2>&1 && \
		   curl -s http://localhost:5001/api/v0/version >/dev/null 2>&1 && \
		   $(DOCKER_COMPOSE) exec -T postgres-graph pg_isready -U graph >/dev/null 2>&1; then \
			echo "${GREEN}${CHECK_MARK} Todos os serviços estão respondendo${NC}"; \
			sleep 5; \
			exit 0; \
		fi; \
		echo "${YELLOW}${INFO} Tentativa $$i de $(MAX_RETRIES). Aguardando serviços inicializarem...${NC}"; \
		sleep $(WAIT_TIME); \
	done; \
	echo "${RED}${CROSS_MARK} Timeout aguardando serviços${NC}"; \
	exit 1

healthcheck:
	@echo "${BLUE}${ARROW} Verificando saúde dos serviços...${NC}"
	@echo "\n${BOLD}Graph Node:${NC}"
	@if curl -s http://localhost:8000/graphql >/dev/null 2>&1; then \
		echo "${GREEN}${CHECK_MARK} Graph Node está respondendo${NC}"; \
	else \
		echo "${RED}${CROSS_MARK} Graph Node não está respondendo${NC}"; \
	fi
	@echo "\n${BOLD}IPFS:${NC}"
	@if curl -s http://localhost:5001/api/v0/version >/dev/null 2>&1; then \
		echo "${GREEN}${CHECK_MARK} IPFS está respondendo${NC}"; \
	else \
		echo "${RED}${CROSS_MARK} IPFS não está respondendo${NC}"; \
	fi
	@echo "\n${BOLD}Postgres:${NC}"
	@if $(DOCKER_COMPOSE) exec -T postgres-graph pg_isready -U graph >/dev/null 2>&1; then \
		echo "${GREEN}${CHECK_MARK} Postgres está respondendo${NC}"; \
	else \
		echo "${RED}${CROSS_MARK} Postgres não está respondendo${NC}"; \
	fi

# =============================================================================
# Comandos de Setup
# =============================================================================

setup: up wait-for-services ## Configura e implanta o subgraph
	@echo "${GREEN}${ARROW} Configurando o TheGraph e implantando o subgraph...${NC}"
	@if [ ! -d "$(DREX_DIR)" ]; then \
		echo "${RED}${CROSS_MARK} Diretório DREX não encontrado em $(DREX_DIR)${NC}"; \
		exit 1; \
	fi
	@echo "${YELLOW}${INFO} Iniciando containers necessários...${NC}"
	@sleep 15
	@echo "${YELLOW}${INFO} Entrando no diretório Drex e gerando código...${NC}"
	@cd $(DREX_DIR) && graph codegen
	@echo "${YELLOW}${INFO} Executando script de inicialização...${NC}"
	@$(MAKE) create-subgraph
	@sleep 10
	@$(MAKE) deploy-subgraph
	@echo "${GREEN}${CHECK_MARK} Configuração concluída!${NC}"

# =============================================================================
# Comandos de Gerenciamento
# =============================================================================

status:
	@echo "${GREEN}${ARROW} Verificando status dos containers do TheGraph...${NC}"
	@$(DOCKER_COMPOSE) ps
	@echo "\n${BLUE}${ARROW} Volumes:${NC}"
	@docker volume ls | grep -E "pgdata|ipfs" || echo "${YELLOW}${INFO} Nenhum volume encontrado${NC}"
	@echo "\n${BLUE}${ARROW} Networks:${NC}"
	@docker network ls | grep "protocol" || echo "${YELLOW}${INFO} Nenhuma network encontrada${NC}"
	@echo "\n${BLUE}${ARROW} Uso de recursos:${NC}"
	@docker stats --no-stream $(GRAPH_SERVICE) $(IPFS_SERVICE) $(POSTGRES_SERVICE)

restart:
	@echo "${YELLOW}${ARROW} Reiniciando containers do TheGraph...${NC}"
	@$(DOCKER_COMPOSE) restart
	@echo "${GREEN}${CHECK_MARK} Containers reiniciados${NC}"
	@$(MAKE) healthcheck

# =============================================================================
# Comandos de Backup e Restore
# =============================================================================

backup:
	@echo "${BLUE}${ARROW} Iniciando backup dos dados...${NC}"
	@mkdir -p $(BACKUP_DIR)
	@echo "${YELLOW}${INFO} Backup do Postgres...${NC}"
	@$(DOCKER_COMPOSE) exec -T postgres-graph pg_dumpall -U graph > $(BACKUP_DIR)/postgres_$(DATE).sql
	@echo "${YELLOW}${INFO} Backup do IPFS...${NC}"
	@docker cp $$(docker-compose ps -q ipfs):/data/ipfs $(BACKUP_DIR)/ipfs_$(DATE)
	@echo "${GREEN}${CHECK_MARK} Backup concluído em $(BACKUP_DIR)${NC}"

restore:
	@echo "${RED}${WARNING} Atenção: Esta operação irá sobrescrever os dados atuais!${NC}"
	@read -p "Digite o nome do backup a ser restaurado (formato: YYYY-MM-DD_HH-MM-SS): " backup_date; \
	if [ -f "$(BACKUP_DIR)/postgres_$$backup_date.sql" ] && [ -d "$(BACKUP_DIR)/ipfs_$$backup_date" ]; then \
		echo "${YELLOW}${INFO} Parando serviços...${NC}"; \
		$(MAKE) down; \
		echo "${YELLOW}${INFO} Restaurando dados...${NC}"; \
		cat $(BACKUP_DIR)/postgres_$$backup_date.sql | docker exec -i postgres-graph psql -U graph; \
		docker cp $(BACKUP_DIR)/ipfs_$$backup_date/. $$(docker-compose ps -q ipfs):/data/ipfs/; \
		echo "${GREEN}${CHECK_MARK} Restauração concluída${NC}"; \
		$(MAKE) up; \
	else \
		echo "${RED}${CROSS_MARK} Backup não encontrado para a data especificada${NC}"; \
		exit 1; \
	fi

# =============================================================================
# Comandos de Diagnóstico
# =============================================================================

debug:
	@echo "${BLUE}${ARROW} Coletando informações de diagnóstico...${NC}"
	@echo "\n${BOLD}Versões dos serviços:${NC}"
	@docker exec $(GRAPH_SERVICE) graph-node --version || echo "${RED}${CROSS_MARK} Erro ao obter versão do graph-node${NC}"
	@curl -s http://localhost:5001/api/v0/version || echo "${RED}${CROSS_MARK} Erro ao obter versão do IPFS${NC}"
	@$(DOCKER_COMPOSE) exec postgres-graph psql -V || echo "${RED}${CROSS_MARK} Erro ao obter versão do Postgres${NC}"
	@echo "\n${BOLD}Logs recentes:${NC}"
	@$(DOCKER_COMPOSE) logs --tail=50
	@echo "\n${BOLD}Uso de recursos:${NC}"
	@docker stats --no-stream $(GRAPH_SERVICE) $(IPFS_SERVICE) $(POSTGRES_SERVICE)

list-volumes:
	@echo "${BLUE}${ARROW} Volumes do projeto:${NC}"
	@docker volume ls --filter name=$(PROJECT_NAME)

list-networks:
	@echo "${BLUE}${ARROW} Networks do projeto:${NC}"
	@docker network ls --filter name=protocol

# =============================================================================
# Comandos de Subgraph
# =============================================================================

create-subgraph: wait-for-services
	@echo "${YELLOW}${ARROW} Criando novo subgraph...${NC}"
	@if [ ! -f "$(DREX_DIR)/subgraph.yaml" ]; then \
		echo "${RED}${CROSS_MARK} Erro: arquivo subgraph.yaml não encontrado em $(DREX_DIR)${NC}"; \
		exit 1; \
	fi
	@echo "${YELLOW}${INFO} Verificando conexão com graph-node...${NC}"
	@for i in $$(seq 1 5); do \
		if curl -s http://localhost:8020 >/dev/null 2>&1; then \
			cd $(DREX_DIR) && \
			graph create --node http://localhost:8020/ drex && \
			break; \
		fi; \
		if [ $$i -eq 5 ]; then \
			echo "${RED}${CROSS_MARK} Não foi possível conectar ao graph-node${NC}"; \
			exit 1; \
		fi; \
		echo "${YELLOW}${INFO} Tentativa $$i de 5. Aguardando graph-node...${NC}"; \
		sleep 5; \
	done
	@echo "${GREEN}${CHECK_MARK} Subgraph criado com sucesso${NC}"

deploy-subgraph: wait-for-services
	@echo "${YELLOW}${ARROW} Implantando subgraph...${NC}"
	@if [ ! -f "$(DREX_DIR)/subgraph.yaml" ]; then \
		echo "${RED}${CROSS_MARK} Erro: arquivo subgraph.yaml não encontrado em $(DREX_DIR)${NC}"; \
		exit 1; \
	fi
	@cd $(DREX_DIR) && \
	graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 drex
	@echo "${GREEN}${CHECK_MARK} Subgraph implantado com sucesso${NC}"

deploy: deploy-subgraph ## Alias para deploy-subgraph
	@echo "${GREEN}${CHECK_MARK} Deploy concluído${NC}"

# =============================================================================
# Comandos de Limpeza
# =============================================================================

reset: ## Reinicia o ambiente e limpa os dados
	@echo "${RED}${WARNING} ATENÇÃO: Isso irá remover todos os dados! ${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		echo "${YELLOW}${INFO} Parando serviços...${NC}"; \
		$(MAKE) down; \
		echo "${YELLOW}${INFO} Removendo volumes...${NC}"; \
		docker volume rm $$(docker volume ls -q | grep $(PROJECT_NAME)) 2>/dev/null || true; \
		echo "${YELLOW}${INFO} Reiniciando serviços...${NC}"; \
		$(MAKE) setup; \
		echo "${GREEN}${CHECK_MARK} Reset concluído${NC}"; \
	else \
		echo "${YELLOW}${INFO} Operação cancelada${NC}"; \
	fi

clean: ## Remove containers e volumes
	@echo "${RED}${WARNING} ATENÇÃO: Isso irá remover todos os dados! ${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		echo "${YELLOW}${INFO} Parando serviços...${NC}"; \
		$(MAKE) down; \
		echo "${YELLOW}${INFO} Removendo volumes...${NC}"; \
		docker volume rm $$(docker volume ls -q | grep $(PROJECT_NAME)) 2>/dev/null || true; \
		echo "${GREEN}${CHECK_MARK} Limpeza concluída${NC}"; \
	else \
		echo "${YELLOW}${INFO} Operação cancelada${NC}"; \
	fi 