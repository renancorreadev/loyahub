# =============================================================================
# Makefile Unificado para Gerenciamento de Serviços
# Autor: LoyaHub Team
# Versão: 2.0.0
# 
# Este Makefile fornece uma interface unificada para gerenciar múltiplos
# serviços Docker em um ambiente de desenvolvimento.
#
# Recursos:
# - Gerenciamento unificado de múltiplos serviços
# - Sistema de logs com níveis de verbosidade
# - Verificação automática de dependências
# - Interface consistente para todos os serviços
# =============================================================================

# -----------------------------------------------------------------------------
# Variáveis de Configuração
# -----------------------------------------------------------------------------
SERVICES := besu db keycloak monitoring thegraph vault
MAKEFLAGS += --no-print-directory
.DEFAULT_GOAL := help

# Cores e Formatação
BOLD := \033[1m
RESET := \033[0m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
BLUE := \033[34m
CYAN := \033[36m
WHITE := \033[37m

# Mapeamento de comandos específicos por serviço
BESU_START_CMD := start
THEGRAPH_START_CMD := up
MONITORING_START_CMD := up
VAULT_START_CMD := setup
DB_START_CMD := setup
KEYCLOAK_START_CMD := setup

# Configuração de Logs
VERBOSE ?= 1
TIMESTAMP := $(shell date '+%Y-%m-%d %H:%M:%S')

define log_debug
	@if [ $(VERBOSE) -ge 2 ]; then \
		printf "$(CYAN)[DEBUG]$(RESET) [$(TIMESTAMP)] %s\n" "$(1)"; \
	fi
endef

define log_info
	@if [ $(VERBOSE) -ge 1 ]; then \
		printf "$(BLUE)[INFO]$(RESET) [$(TIMESTAMP)] %s\n" "$(1)"; \
	fi
endef

define log_success
	@printf "$(GREEN)[SUCCESS]$(RESET) [$(TIMESTAMP)] %s\n" "$(1)"
endef

define log_warning
	@printf "$(YELLOW)[WARNING]$(RESET) [$(TIMESTAMP)] %s\n" "$(1)"
endef

define log_error
	@printf "$(RED)[ERROR]$(RESET) [$(TIMESTAMP)] %s\n" "$(1)"
endef

# -----------------------------------------------------------------------------
# Funções de Verificação e Limpeza
# -----------------------------------------------------------------------------
define clean_besu_data
	@if [ -d "besu/data" ]; then \
		printf "$(YELLOW)⚠ Diretório besu/data já existe. Limpando...$(RESET)\n"; \
		rm -rf besu/data/*; \
	fi
endef

# -----------------------------------------------------------------------------
# Verificação de Dependências
# -----------------------------------------------------------------------------
.env-check:
	@for service in $(SERVICES); do \
		if [ ! -f "$$service/.env" ] && [ -f "$$service/.env.example" ]; then \
			$(call log_warning,"Arquivo .env não encontrado para $$service. Copiando do .env.example..."); \
			cp $$service/.env.example $$service/.env; \
		fi \
	done

# -----------------------------------------------------------------------------
# Targets Principais
# -----------------------------------------------------------------------------
.PHONY: help all start stop status restart clean logs check setup \
        $(foreach service,$(SERVICES),$(service)-help) \
        $(foreach service,$(SERVICES),$(service)-setup) \
        $(foreach service,$(SERVICES),$(service)-start) \
        $(foreach service,$(SERVICES),$(service)-stop) \
        $(foreach service,$(SERVICES),$(service)-status) \
        $(foreach service,$(SERVICES),$(service)-restart) \
        $(foreach service,$(SERVICES),$(service)-clean) \
        $(foreach service,$(SERVICES),$(service)-logs) \
        $(foreach service,$(SERVICES),$(service)-check)

help: ## Exibe ajuda com todos os targets e descrições
	@printf "$(BOLD)$(BLUE)🌟 Sistema de Gerenciamento Unificado v2.0.0$(RESET)\n"
	@printf "$(CYAN)=================================================$(RESET)\n"
	@printf "\n"
	@printf "$(BOLD)🔧 CONFIGURAÇÕES:$(RESET)\n"
	@printf "  $(WHITE)VERBOSE=$(VERBOSE)$(RESET)  (0=mínimo, 1=normal, 2=debug)\n"
	@printf "\n"
	@printf "$(BOLD)🚀 COMANDOS GLOBAIS:$(RESET)\n"
	@printf "  $(CYAN)make all$(RESET)               Inicia todos os serviços\n"
	@printf "  $(CYAN)make start$(RESET)             Inicia um serviço específico (SERVICE=nome)\n"
	@printf "  $(CYAN)make stop$(RESET)              Para um serviço específico (SERVICE=nome)\n"
	@printf "  $(CYAN)make status$(RESET)            Verifica status detalhado de todos os serviços\n"
	@printf "  $(CYAN)make restart$(RESET)           Reinicia um serviço específico (SERVICE=nome)\n"
	@printf "  $(CYAN)make clean$(RESET)             Para e limpa todos os serviços (⚠️ Destrutivo!)\n"
	@printf "  $(CYAN)make logs$(RESET)              Exibe logs de um serviço (SERVICE=nome)\n"
	@printf "  $(CYAN)make check$(RESET)             Verifica a saúde de todos os serviços\n"
	@printf "  $(CYAN)make setup$(RESET)             Configura todos os serviços\n"
	@printf "\n"
	@printf "$(BOLD)📦 SERVIÇOS DISPONÍVEIS:$(RESET)\n"
	@printf "  $(WHITE)- besu$(RESET)        Rede Blockchain Hyperledger Besu (requer setup + start)\n"
	@printf "  $(WHITE)- db$(RESET)          Banco de Dados PostgreSQL (requer setup)\n"
	@printf "  $(WHITE)- keycloak$(RESET)    Gerenciamento de Identidade (requer setup)\n"
	@printf "  $(WHITE)- monitoring$(RESET)  Prometheus + Grafana (requer up)\n"
	@printf "  $(WHITE)- thegraph$(RESET)    Indexador de Blockchain (requer up)\n"
	@printf "  $(WHITE)- vault$(RESET)       Gerenciamento de Segredos (requer setup)\n"
	@printf "\n"
	@printf "$(BOLD)📝 EXEMPLOS DE USO:$(RESET)\n"
	@printf "  $(WHITE)Iniciar com modo debug:$(RESET)\n"
	@printf "    VERBOSE=2 make all\n"
	@printf "\n"
	@printf "  $(WHITE)Iniciar serviço específico:$(RESET)\n"
	@printf "    make start SERVICE=vault\n"
	@printf "    # ou\n"
	@printf "    make vault-start\n"
	@printf "\n"
	@printf "  $(WHITE)Ver logs com timestamp:$(RESET)\n"
	@printf "    make logs SERVICE=besu\n"
	@printf "\n"
	@printf "$(BOLD)⚠️  NOTAS IMPORTANTES:$(RESET)\n"
	@printf "  $(RED)1.$(RESET) O comando 'clean' é destrutivo e removerá todos os dados\n"
	@printf "  $(YELLOW)2.$(RESET) Arquivos .env são gerados automaticamente se não existirem\n"
	@printf "  $(GREEN)3.$(RESET) Use VERBOSE=2 para debug detalhado\n"
	@printf "\n"
	@printf "$(CYAN)=================================================$(RESET)\n"
	@printf "\n"
	@printf "$(BOLD)📚 COMANDOS ESPECÍFICOS POR SERVIÇO:$(RESET)\n"
	@for service in $(SERVICES); do \
		printf "\n$(BOLD)$$service:$(RESET)\n"; \
		$(MAKE) -C $$service help 2>/dev/null || printf "  $(RED)Help não disponível para $*$(RESET)\n"; \
	done

# -----------------------------------------------------------------------------
# Targets Genéricos para Serviços
# -----------------------------------------------------------------------------
%-help:
	@$(MAKE) -C $* help 2>/dev/null || printf "  $(RED)Help não disponível para $*$(RESET)\n"

%-setup:
	$(call log_info,"Configurando serviço $*...")
	@$(MAKE) -C $* setup 2>/dev/null || printf "  $(RED)Setup não disponível para $*$(RESET)\n"

%-start:
	$(call log_info,"Iniciando serviço $*...")
	@if [ "$*" = "besu" ]; then \
		if [ -d "besu/data" ]; then \
			printf "$(YELLOW)⚠ Diretório besu/data já existe. Limpando...$(RESET)\n"; \
			rm -rf besu/data/*; \
		fi; \
		$(MAKE) -C $* setup && $(MAKE) -C $* start; \
	elif [ "$*" = "thegraph" ] || [ "$*" = "monitoring" ]; then \
		$(MAKE) -C $* up; \
	else \
		$(MAKE) -C $* setup; \
	fi

%-stop:
	$(call log_info,"Parando serviço $*...")
	@$(MAKE) -C $* stop 2>/dev/null || printf "  $(RED)Stop não disponível para $*$(RESET)\n"

%-status:
	$(call log_info,"Verificando status do serviço $*...")
	@$(MAKE) -C $* status 2>/dev/null || printf "  $(RED)Status não disponível para $*$(RESET)\n"

%-restart:
	$(call log_info,"Reiniciando serviço $*...")
	@$(MAKE) -C $* restart 2>/dev/null || printf "  $(RED)Restart não disponível para $*$(RESET)\n"

%-clean:
	$(call log_warning,"ATENÇÃO: Isso removerá TODOS os dados de TODOS os serviços!")
	$(call log_warning,"Os seguintes serviços serão afetados:")
	@for service in $(SERVICES); do \
		printf "  $(RED)- $$service$(RESET)\n"; \
	done
	@printf "\n"
	@read -p "$(YELLOW)Tem certeza que deseja continuar? [y/N]: $(RESET)" confirm && \
		[ "$${confirm:-N}" = "y" ] || (echo "$(YELLOW)Operação cancelada.$(RESET)" && exit 1)
	@printf "\n"
	@for service in $(SERVICES); do \
		printf "$(BOLD)Limpando $$service...$(RESET)\n"; \
		if [ -f "$$service/docker-compose.yml" ]; then \
			cd $$service && docker-compose down -v 2>/dev/null || true; cd ..; \
		fi; \
		if [ -d "$$service/data" ]; then \
			rm -rf $$service/data/* 2>/dev/null || true; \
		fi; \
		if [ -f "$$service/.env" ]; then \
			rm -f $$service/.env 2>/dev/null || true; \
		fi; \
		$(MAKE) -C $$service clean >/dev/null 2>&1 || true; \
		printf "$(GREEN)✓ $$service limpo$(RESET)\n\n"; \
	done
	$(call log_success,"Todos os serviços foram limpos!")

%-logs:
	$(call log_info,"Exibindo logs do serviço $*...")
	@$(MAKE) -C $* logs 2>/dev/null || printf "  $(RED)Logs não disponível para $*$(RESET)\n"

%-check:
	$(call log_info,"Verificando saúde do serviço $*...")
	@$(MAKE) -C $* check 2>/dev/null || printf "  $(RED)Check não disponível para $*$(RESET)\n"

# -----------------------------------------------------------------------------
# Targets Globais
# -----------------------------------------------------------------------------
all: .env-check
	$(call log_info,"Iniciando todos os serviços...")
	@for service in $(SERVICES); do \
		printf "$(BOLD)Iniciando $$service:$(RESET)\n"; \
		if [ "$$service" = "besu" ]; then \
			if [ -d "besu/data" ]; then \
				printf "$(YELLOW)⚠ Diretório besu/data já existe. Limpando...$(RESET)\n"; \
				rm -rf besu/data/*; \
			fi; \
			$(MAKE) -C $$service setup && $(MAKE) -C $$service start; \
		elif [ "$$service" = "thegraph" ] || [ "$$service" = "monitoring" ]; then \
			$(MAKE) -C $$service up; \
		else \
			$(MAKE) -C $$service setup; \
		fi; \
		printf "\n"; \
	done
	$(call log_success,"Todos os serviços foram iniciados!")

start: ## Inicia um serviço específico
	@if [ -z "$(SERVICE)" ]; then \
		$(call log_error,"Especifique o serviço com SERVICE=nome"); \
		exit 1; \
	fi
	@if [ ! -d "$(SERVICE)" ]; then \
		$(call log_error,"Serviço '$(SERVICE)' não encontrado"); \
		exit 1; \
	fi
	$(call log_info,"Iniciando serviço $(SERVICE)...")
	@if [ "$(SERVICE)" = "besu" ]; then \
		if [ -d "besu/data" ]; then \
			printf "$(YELLOW)⚠ Diretório besu/data já existe. Limpando...$(RESET)\n"; \
			rm -rf besu/data/*; \
		fi; \
		$(MAKE) -C $(SERVICE) setup && $(MAKE) -C $(SERVICE) start; \
	elif [ "$(SERVICE)" = "thegraph" ] || [ "$(SERVICE)" = "monitoring" ]; then \
		$(MAKE) -C $(SERVICE) up; \
	else \
		$(MAKE) -C $(SERVICE) setup; \
	fi

stop: ## Para um serviço específico
	@if [ -z "$(SERVICE)" ]; then \
		$(call log_error,"Especifique o serviço com SERVICE=nome"); \
		exit 1; \
	fi
	@if [ ! -d "$(SERVICE)" ]; then \
		$(call log_error,"Serviço '$(SERVICE)' não encontrado"); \
		exit 1; \
	fi
	@$(MAKE) $(SERVICE)-stop

status: ## Verifica o status de todos os serviços
	$(call log_info,"Verificando status de todos os serviços...")
	@printf "\n$(BOLD)Status dos Serviços:$(RESET)\n"
	@for service in $(SERVICES); do \
		printf "\n$(BOLD)$$service:$(RESET)\n"; \
		if [ -f "$$service/docker-compose.yml" ]; then \
			containers=$$(cd $$service && docker-compose ps -q 2>/dev/null); \
			if [ -n "$$containers" ]; then \
				cd $$service && docker-compose ps; \
				$(call log_debug,"Verificando logs recentes de $$service..."); \
				cd $$service && docker-compose logs --tail=5 2>/dev/null || true; \
			else \
				$(call log_warning,"Serviço $$service não está em execução"); \
			fi; \
		else \
			$(call log_error,"docker-compose.yml não encontrado para $$service"); \
		fi; \
	done
	@printf "\n$(BOLD)Uso de Recursos:$(RESET)\n"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null || true

restart: ## Reinicia um serviço específico
	@if [ -z "$(SERVICE)" ]; then \
		$(call log_error,"Especifique o serviço com SERVICE=nome"); \
		exit 1; \
	fi
	@if [ ! -d "$(SERVICE)" ]; then \
		$(call log_error,"Serviço '$(SERVICE)' não encontrado"); \
		exit 1; \
	fi
	@$(MAKE) $(SERVICE)-restart

clean: ## Para e limpa todos os serviços
	$(call log_warning,"ATENÇÃO: Isso removerá TODOS os dados de TODOS os serviços!")
	$(call log_warning,"Os seguintes serviços serão afetados:")
	@for service in $(SERVICES); do \
		printf "  $(RED)- $$service$(RESET)\n"; \
	done
	@printf "\n"
	@read -p "$(YELLOW)Tem certeza que deseja continuar? [y/N]: $(RESET)" confirm && \
		[ "$${confirm:-N}" = "y" ] || (echo "$(YELLOW)Operação cancelada.$(RESET)" && exit 1)
	@printf "\n"
	@for service in $(SERVICES); do \
		printf "$(BOLD)Limpando $$service...$(RESET)\n"; \
		if [ -f "$$service/docker-compose.yml" ]; then \
			cd $$service && docker-compose down -v 2>/dev/null || true; cd ..; \
		fi; \
		if [ -d "$$service/data" ]; then \
			rm -rf $$service/data/* 2>/dev/null || true; \
		fi; \
		if [ -f "$$service/.env" ]; then \
			rm -f $$service/.env 2>/dev/null || true; \
		fi; \
		$(MAKE) -C $$service clean >/dev/null 2>&1 || true; \
		printf "$(GREEN)✓ $$service limpo$(RESET)\n\n"; \
	done
	$(call log_success,"Todos os serviços foram limpos!")

logs: ## Exibe logs de um serviço
	@if [ -z "$(SERVICE)" ]; then \
		$(call log_error,"Especifique o serviço com SERVICE=nome"); \
		exit 1; \
	fi
	@if [ ! -d "$(SERVICE)" ]; then \
		$(call log_error,"Serviço '$(SERVICE)' não encontrado"); \
		exit 1; \
	fi
	@$(MAKE) $(SERVICE)-logs

check: ## Verifica a saúde de todos os serviços
	$(call log_info,"Verificando saúde de todos os serviços...")
	@for service in $(SERVICES); do \
		printf "\n$(BOLD)$$service:$(RESET)\n"; \
		$(MAKE) -C $$service check 2>/dev/null || printf "  $(RED)Check não disponível para $$service$(RESET)\n"; \
	done

setup: .env-check
	$(call log_info,"Configurando todos os serviços...")
	@for service in $(SERVICES); do \
		printf "\n$(BOLD)Configurando $$service:$(RESET)\n"; \
		$(MAKE) -C $$service setup 2>/dev/null || printf "  $(RED)Setup não disponível para $$service$(RESET)\n"; \
	done
	$(call log_success,"Todos os serviços foram configurados!")
