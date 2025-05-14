# =============================================================================
# Makefile para Gerenciamento do Ambiente de Monitoramento (Prometheus + Grafana)
# Versão: 2.0.0
# =============================================================================

# Definição de variáveis
PROJECT_NAME := monitoring
PROMETHEUS_SERVICE := prometheus
GRAFANA_SERVICE := grafana
DOCKER_COMPOSE := docker-compose
MAX_RETRIES := 30
WAIT_TIME := 5
GRAFANA_PORT := 3000
PROMETHEUS_PORT := 9090
CURRENT_DIR := $(shell pwd)
DATE := $(shell date '+%Y-%m-%d_%H-%M-%S')
BACKUP_DIR := ./backups

# Cores e formatação
YELLOW := \033[1;33m
GREEN  := \033[1;32m
RED    := \033[1;31m
BLUE   := \033[1;34m
WHITE  := \033[1;37m
BOLD   := \033[1m
RESET  := \033[0m
CHECK_MARK := ✓
CROSS_MARK := ✖
ARROW := ➜

# Definição de alvos .PHONY
.PHONY: help up down ps logs service-logs reset clean status check wait-for-services backup restore healthcheck update-config restart list-volumes list-networks debug

# Alvo padrão
.DEFAULT_GOAL := help

# =============================================================================
# Documentação e Ajuda
# =============================================================================

help: ## Mostra esta mensagem de ajuda
	@echo "$(WHITE)════════════════════════════════════════════════════════════════$(RESET)"
	@echo "$(BOLD)🔍 Sistema de Monitoramento - Prometheus + Grafana v2.0.0$(RESET)"
	@echo "$(WHITE)════════════════════════════════════════════════════════════════$(RESET)"
	@echo "$(YELLOW)Comandos disponíveis:$(RESET)"
	@echo ""
	@echo "$(BOLD)🚀 Gerenciamento de Serviços:$(RESET)"
	@echo "  $(GREEN)make up$(RESET)              - Inicia todos os serviços de monitoramento"
	@echo "  $(GREEN)make down$(RESET)            - Para todos os serviços"
	@echo "  $(GREEN)make restart$(RESET)         - Reinicia todos os serviços"
	@echo "  $(GREEN)make status$(RESET)          - Mostra o status atual dos serviços"
	@echo ""
	@echo "$(BOLD)📊 Logs e Monitoramento:$(RESET)"
	@echo "  $(GREEN)make logs$(RESET)            - Exibe logs de todos os serviços"
	@echo "  $(GREEN)make service-logs$(RESET)    - Exibe logs de um serviço específico (SERVICE=nome)"
	@echo "  $(GREEN)make healthcheck$(RESET)     - Verifica a saúde dos serviços"
	@echo ""
	@echo "$(BOLD)🔧 Manutenção:$(RESET)"
	@echo "  $(GREEN)make reset$(RESET)           - Reset dos serviços (mantém configurações)"
	@echo "  $(GREEN)make clean$(RESET)           - Remove completamente todos os recursos"
	@echo "  $(GREEN)make backup$(RESET)          - Realiza backup dos dados"
	@echo "  $(GREEN)make restore$(RESET)         - Restaura backup dos dados"
	@echo ""
	@echo "$(BOLD)🔍 Diagnóstico:$(RESET)"
	@echo "  $(GREEN)make check$(RESET)           - Verifica dependências e requisitos"
	@echo "  $(GREEN)make debug$(RESET)           - Mostra informações detalhadas para debug"
	@echo "  $(GREEN)make list-volumes$(RESET)    - Lista todos os volumes"
	@echo "  $(GREEN)make list-networks$(RESET)   - Lista todas as networks"
	@echo ""
	@echo "$(YELLOW)Exemplos:$(RESET)"
	@echo "  make service-logs SERVICE=prometheus"
	@echo "  make backup NAME=meu_backup"
	@echo "  make restore BACKUP=2023-01-01_12-00-00"
	@echo ""
	@echo "$(RED)Observações:$(RESET)"
	@echo "  - Grafana UI: http://localhost:$(GRAFANA_PORT) (admin/admin)"
	@echo "  - Prometheus UI: http://localhost:$(PROMETHEUS_PORT)"
	@echo "  - Backups são armazenados em: $(BACKUP_DIR)"
	@echo "$(WHITE)════════════════════════════════════════════════════════════════$(RESET)"

# =============================================================================
# Verificação de Ambiente
# =============================================================================

check: ## Verifica dependências necessárias
	@echo "$(BLUE)$(ARROW) Verificando ambiente...$(RESET)"
	@mkdir -p $(BACKUP_DIR)
	@if [ -z "$$(command -v docker)" ]; then \
		echo "$(RED)$(CROSS_MARK) Docker não encontrado. Por favor, instale o Docker.$(RESET)"; \
		exit 1; \
	else \
		echo "$(GREEN)$(CHECK_MARK) Docker encontrado$(RESET)"; \
	fi
	@if [ -z "$$(command -v docker-compose)" ]; then \
		echo "$(RED)$(CROSS_MARK) Docker Compose não encontrado. Por favor, instale o Docker Compose.$(RESET)"; \
		exit 1; \
	else \
		echo "$(GREEN)$(CHECK_MARK) Docker Compose encontrado$(RESET)"; \
	fi
	@if [ -z "$$(command -v curl)" ]; then \
		echo "$(RED)$(CROSS_MARK) Curl não encontrado. Por favor, instale o Curl.$(RESET)"; \
		exit 1; \
	else \
		echo "$(GREEN)$(CHECK_MARK) Curl encontrado$(RESET)"; \
	fi
	@echo "$(GREEN)$(CHECK_MARK) Todas as dependências estão instaladas!$(RESET)"

wait-for-services: ## Aguarda serviços estarem saudáveis
	@echo "$(BLUE)$(ARROW) Aguardando serviços inicializarem...$(RESET)"
	@for i in $$(seq 1 $(MAX_RETRIES)); do \
		if curl -s http://localhost:$(PROMETHEUS_PORT) >/dev/null && \
		   curl -s http://localhost:$(GRAFANA_PORT) >/dev/null; then \
			echo "$(GREEN)$(CHECK_MARK) Todos os serviços estão respondendo!$(RESET)"; \
			exit 0; \
		fi; \
		echo "$(YELLOW)Tentativa $$i de $(MAX_RETRIES). Aguardando...$(RESET)"; \
		sleep $(WAIT_TIME); \
	done; \
	echo "$(RED)$(CROSS_MARK) Timeout aguardando serviços$(RESET)"; \
	exit 1

healthcheck: ## Verifica a saúde dos serviços
	@echo "$(BLUE)$(ARROW) Verificando saúde dos serviços...$(RESET)"
	@echo "\n$(BOLD)Prometheus:$(RESET)"
	@curl -s http://localhost:$(PROMETHEUS_PORT)/-/healthy || echo "$(RED)$(CROSS_MARK) Prometheus não está saudável$(RESET)"
	@echo "\n$(BOLD)Grafana:$(RESET)"
	@curl -s http://localhost:$(GRAFANA_PORT)/api/health || echo "$(RED)$(CROSS_MARK) Grafana não está saudável$(RESET)"

# =============================================================================
# Comandos de Gerenciamento
# =============================================================================

up: check ## Inicia todos os serviços
	@echo "$(BLUE)$(ARROW) Iniciando serviços do $(PROJECT_NAME)...$(RESET)"
	@$(DOCKER_COMPOSE) up -d
	@$(MAKE) wait-for-services
	@echo "$(GREEN)$(CHECK_MARK) Serviços iniciados com sucesso!$(RESET)"
	@echo "$(WHITE)📊 Grafana: http://localhost:$(GRAFANA_PORT) (admin/admin)$(RESET)"
	@echo "$(WHITE)📈 Prometheus: http://localhost:$(PROMETHEUS_PORT)$(RESET)"

down: ## Para todos os serviços
	@echo "$(BLUE)$(ARROW) Parando serviços...$(RESET)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)$(CHECK_MARK) Serviços parados com sucesso!$(RESET)"

restart: down up ## Reinicia todos os serviços

status: ## Mostra status dos serviços
	@echo "$(BLUE)$(ARROW) Status dos serviços:$(RESET)"
	@$(DOCKER_COMPOSE) ps
	@echo "\n$(BLUE)$(ARROW) Volumes:$(RESET)"
	@docker volume ls | grep "monitoring"
	@echo "\n$(BLUE)$(ARROW) Networks:$(RESET)"
	@docker network ls | grep "protocol"
	@echo "\n$(BLUE)$(ARROW) Uso de recursos:$(RESET)"
	@docker stats --no-stream $(PROMETHEUS_SERVICE) $(GRAFANA_SERVICE)

# =============================================================================
# Backup e Restore
# =============================================================================

backup: ## Realiza backup dos dados
	@echo "$(BLUE)$(ARROW) Iniciando backup...$(RESET)"
	@mkdir -p $(BACKUP_DIR)
	@BACKUP_NAME=$${NAME:-backup_$(DATE)}; \
	echo "$(YELLOW)Criando backup: $$BACKUP_NAME$(RESET)"; \
	docker run --rm --volumes-from $(PROMETHEUS_SERVICE) -v $(CURRENT_DIR)/$(BACKUP_DIR):/backup \
		ubuntu tar czf /backup/$$BACKUP_NAME.tar.gz /prometheus; \
	docker run --rm --volumes-from $(GRAFANA_SERVICE) -v $(CURRENT_DIR)/$(BACKUP_DIR):/backup \
		ubuntu tar czf /backup/$$BACKUP_NAME_grafana.tar.gz /var/lib/grafana; \
	echo "$(GREEN)$(CHECK_MARK) Backup realizado com sucesso em $(BACKUP_DIR)/$$BACKUP_NAME.tar.gz$(RESET)"

restore: ## Restaura backup dos dados
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(RED)$(CROSS_MARK) Especifique o backup a ser restaurado com BACKUP=nome_do_backup$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)$(ARROW) Restaurando backup $(BACKUP)...$(RESET)"
	@$(MAKE) down
	@docker run --rm --volumes-from $(PROMETHEUS_SERVICE) -v $(CURRENT_DIR)/$(BACKUP_DIR):/backup \
		ubuntu bash -c "cd / && tar xzf /backup/$(BACKUP).tar.gz"
	@docker run --rm --volumes-from $(GRAFANA_SERVICE) -v $(CURRENT_DIR)/$(BACKUP_DIR):/backup \
		ubuntu bash -c "cd / && tar xzf /backup/$(BACKUP)_grafana.tar.gz"
	@$(MAKE) up
	@echo "$(GREEN)$(CHECK_MARK) Backup restaurado com sucesso!$(RESET)"

# =============================================================================
# Logs e Monitoramento
# =============================================================================

logs: ## Mostra logs de todos os serviços
	@echo "$(BLUE)$(ARROW) Exibindo logs de todos os serviços...$(RESET)"
	@$(DOCKER_COMPOSE) logs -f

service-logs: ## Mostra logs de um serviço específico
	@if [ "$(SERVICE)" = "" ]; then \
		echo "$(RED)$(CROSS_MARK) Erro: Especifique o serviço com SERVICE=nome_do_servico$(RESET)"; \
		echo "$(WHITE)Exemplo: make service-logs SERVICE=prometheus$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)$(ARROW) Exibindo logs do serviço $(SERVICE)...$(RESET)"
	@$(DOCKER_COMPOSE) logs -f $(SERVICE)

# =============================================================================
# Comandos de Diagnóstico
# =============================================================================

debug: ## Mostra informações detalhadas para debug
	@echo "$(BLUE)$(ARROW) Informações de Debug:$(RESET)"
	@echo "\n$(BOLD)Versões:$(RESET)"
	@docker --version
	@docker-compose --version
	@echo "\n$(BOLD)Containers:$(RESET)"
	@docker ps -a | grep -E "$(PROMETHEUS_SERVICE)|$(GRAFANA_SERVICE)"
	@echo "\n$(BOLD)Volumes:$(RESET)"
	@docker volume ls | grep "monitoring"
	@echo "\n$(BOLD)Networks:$(RESET)"
	@docker network ls | grep "protocol"
	@echo "\n$(BOLD)Logs recentes:$(RESET)"
	@$(DOCKER_COMPOSE) logs --tail=20

list-volumes: ## Lista todos os volumes
	@echo "$(BLUE)$(ARROW) Volumes do projeto:$(RESET)"
	@docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" | grep "monitoring"

list-networks: ## Lista todas as networks
	@echo "$(BLUE)$(ARROW) Networks do projeto:$(RESET)"
	@docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" | grep "protocol"

# =============================================================================
# Comandos de Manutenção
# =============================================================================

reset: ## Reset dos serviços (mantém configurações)
	@echo "$(RED)⚠ ATENÇÃO: Isso irá reiniciar todos os serviços!$(RESET)"
	@read -p "$(YELLOW)Deseja continuar? [y/N] $(RESET)" -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)$(ARROW) Reiniciando serviços...$(RESET)"; \
		$(DOCKER_COMPOSE) down; \
		$(DOCKER_COMPOSE) up -d; \
		$(MAKE) wait-for-services; \
		echo "$(GREEN)$(CHECK_MARK) Serviços reiniciados com sucesso!$(RESET)"; \
	else \
		echo "$(YELLOW)Operação cancelada.$(RESET)"; \
	fi

clean: ## Remove completamente todos os recursos
	@echo "$(RED)⚠ ATENÇÃO: Este comando irá remover TODOS os recursos do ambiente de monitoramento!$(RESET)"
	@echo "$(RED)⚠ Isso inclui:$(RESET)"
	@echo "  $(WHITE)- Containers em execução$(RESET)"
	@echo "  $(WHITE)- Volumes e dados persistentes$(RESET)"
	@echo "  $(WHITE)- Networks relacionadas$(RESET)"
	@echo "  $(WHITE)- Imagens não utilizadas$(RESET)"
	@echo "  $(WHITE)- Backups locais$(RESET)"
	@read -p "$(YELLOW)Deseja continuar? [y/N] $(RESET)" -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)$(ARROW) Parando todos os serviços...$(RESET)"; \
		$(DOCKER_COMPOSE) down --remove-orphans; \
		echo "$(BLUE)$(ARROW) Removendo volumes do projeto...$(RESET)"; \
		docker volume rm -f $$(docker volume ls -q | grep "monitoring"); \
		echo "$(BLUE)$(ARROW) Removendo containers parados...$(RESET)"; \
		docker rm -f $$(docker ps -a -q --filter "name=prometheus|grafana" 2>/dev/null) 2>/dev/null || true; \
		echo "$(BLUE)$(ARROW) Removendo networks relacionadas...$(RESET)"; \
		docker network rm protocol 2>/dev/null || true; \
		echo "$(BLUE)$(ARROW) Removendo imagens não utilizadas...$(RESET)"; \
		docker image rm -f prom/prometheus grafana/grafana:latest 2>/dev/null || true; \
		echo "$(BLUE)$(ARROW) Removendo diretório de backups...$(RESET)"; \
		rm -rf $(BACKUP_DIR); \
		echo "$(BLUE)$(ARROW) Limpando recursos Docker não utilizados...$(RESET)"; \
		docker system prune -f; \
		echo "$(GREEN)$(CHECK_MARK) Limpeza completa realizada com sucesso!$(RESET)"; \
		echo "$(WHITE)💡 O ambiente de monitoramento foi completamente removido.$(RESET)"; \
	else \
		echo "$(YELLOW)Operação cancelada.$(RESET)"; \
	fi 