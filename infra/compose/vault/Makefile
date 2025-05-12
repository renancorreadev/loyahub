# =============================================================================
# Makefile para Gerenciamento do HashiCorp Vault
# Autor: LoyaHub Team
# =============================================================================

# -----------------------------------------------------------------------------
# Verificação de Dependências
# -----------------------------------------------------------------------------
REQUIRED_BINS := docker docker-compose jq curl
$(foreach bin,$(REQUIRED_BINS),\
    $(if $(shell command -v $(bin) 2> /dev/null),,\
        $(error Programa necessário não encontrado: $(bin). Por favor, instale-o primeiro.)))

# -----------------------------------------------------------------------------
# Variáveis de Configuração
# -----------------------------------------------------------------------------
SCRIPTS_DIR := ./scripts
DOCKER_COMPOSE := docker-compose
VAULT_CONTAINER := vault
DATA_DIR := ./data
ENV_FILE := .env

# -----------------------------------------------------------------------------
# Cores e Formatação
# -----------------------------------------------------------------------------
BOLD := \033[1m
RESET := \033[0m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
BLUE := \033[34m
CYAN := \033[36m
WHITE := \033[37m

# -----------------------------------------------------------------------------
# Funções Auxiliares
# -----------------------------------------------------------------------------
define log_info
    @printf "$(BLUE)➜ $(WHITE)%s$(RESET)\n" "$(1)"
endef

define log_success
    @printf "$(GREEN)✓ $(WHITE)%s$(RESET)\n" "$(1)"
endef

define log_warning
    @printf "$(YELLOW)⚠ $(WHITE)%s$(RESET)\n" "$(1)"
endef

define log_error
    @printf "$(RED)✗ $(WHITE)%s$(RESET)\n" "$(1)"
endef

define check_env_file
    @if [ ! -f $(ENV_FILE) ]; then \
        printf "$(RED)✗ $(WHITE)Arquivo $(ENV_FILE) não encontrado. Execute 'make setup' primeiro.$(RESET)\n"; \
        exit 1; \
    fi
endef

# -----------------------------------------------------------------------------
# Targets Principais
# -----------------------------------------------------------------------------
.PHONY: help setup reset status restart clean check init shell view-token view-env backup restore

help: ## Exibe ajuda com todos os targets e descrições
	@printf "$(BOLD)$(BLUE)🔐 Gerenciamento do HashiCorp Vault$(RESET)\n"
	@printf "$(CYAN)=================================================$(RESET)\n"
	@printf "\n"
	@printf "$(BOLD)🚀 COMANDOS DE INICIALIZAÇÃO:$(RESET)\n"
	@printf "  $(CYAN)setup$(RESET)              Configura o Vault do zero mantendo dados existentes\n"
	@printf "  $(CYAN)init$(RESET)               Apenas inicializa o container sem configurar\n"
	@printf "\n"
	@printf "$(BOLD)🔄 COMANDOS DE MANUTENÇÃO:$(RESET)\n"
	@printf "  $(CYAN)status$(RESET)             Verifica o status atual do Vault e do container\n"
	@printf "  $(CYAN)restart$(RESET)            Reinicia o container do Vault mantendo os dados\n"
	@printf "  $(CYAN)check$(RESET)              Verifica a conexão com o Vault usando o token atual\n"
	@printf "\n"
	@printf "$(BOLD)🔒 GERENCIAMENTO DE CREDENCIAIS:$(RESET)\n"
	@printf "  $(CYAN)view-token$(RESET)         Mostra o token de serviço atual do Vault\n"
	@printf "  $(CYAN)view-env$(RESET)           Mostra todas as variáveis de ambiente configuradas\n"
	@printf "\n"
	@printf "$(BOLD)💾 BACKUP E RESTAURAÇÃO:$(RESET)\n"
	@printf "  $(CYAN)backup$(RESET)             Cria um backup das configurações do Vault\n"
	@printf "  $(CYAN)restore$(RESET)            Restaura um backup das configurações do Vault\n"
	@printf "\n"
	@printf "$(BOLD)⚠️  COMANDOS DESTRUTIVOS:$(RESET)\n"
	@printf "  $(RED)reset$(RESET)               Remove todos os dados e reinicia o Vault\n"
	@printf "  $(RED)clean$(RESET)               Para o container e remove volumes\n"
	@printf "\n"
	@printf "$(BOLD)🛠️  FERRAMENTAS:$(RESET)\n"
	@printf "  $(CYAN)shell$(RESET)              Abre um shell dentro do container do Vault\n"
	@printf "\n"
	@printf "$(BOLD)📝 EXEMPLOS DE USO:$(RESET)\n"
	@printf "  $(WHITE)Primeira configuração:$(RESET)\n"
	@printf "    make setup\n"
	@printf "\n"
	@printf "  $(WHITE)Verificar status:$(RESET)\n"
	@printf "    make status\n"
	@printf "\n"
	@printf "  $(WHITE)Backup e restauração:$(RESET)\n"
	@printf "    make backup\n"
	@printf "    make restore\n"
	@printf "\n"
	@printf "  $(WHITE)Reset completo:$(RESET)\n"
	@printf "    make reset\n"
	@printf "\n"
	@printf "$(BOLD)📚 DOCUMENTAÇÃO:$(RESET)\n"
	@printf "  Para mais informações, consulte:\n"
	@printf "  - README.md do projeto\n"
	@printf "  - https://www.vaultproject.io/docs\n"
	@printf "\n"
	@printf "$(BOLD)⚠️  NOTAS IMPORTANTES:$(RESET)\n"
	@printf "  $(RED)1.$(RESET) Os comandos 'reset' e 'clean' são destrutivos\n"
	@printf "  $(YELLOW)2.$(RESET) Sempre faça backup antes de operações críticas\n"
	@printf "  $(GREEN)3.$(RESET) Mantenha as credenciais em local seguro\n"
	@printf "\n"
	@printf "$(CYAN)==================================================$(RESET)\n"

setup: ## Configura o Vault do zero mantendo dados existentes
	$(call log_info,"Iniciando configuração do Vault...")
	@chmod +x $(SCRIPTS_DIR)/setup-vault.sh
	@$(SCRIPTS_DIR)/setup-vault.sh
	$(call log_success,"Configuração concluída!")

reset: ## Remove todos os dados e reinicia o Vault (⚠️ Destrutivo!)
	$(call log_warning,"ATENÇÃO: Isso removerá TODOS os dados do Vault!")
	@read -p "$(YELLOW)Tem certeza que deseja continuar? [y/N]:$(RESET) " confirm && \
		[ "$${confirm:-N}" = "y" ] || exit 1
	@chmod +x $(SCRIPTS_DIR)/reset-vault.sh
	@$(SCRIPTS_DIR)/reset-vault.sh
	$(call log_info,"Reiniciando configuração...")
	@$(MAKE) setup

status: ## Verifica o status atual do Vault e do container
	@printf "$(BLUE)➜ Verificando status do Vault...$(RESET)\n"
	@printf "$(BOLD)📦 STATUS DO CONTAINER:$(RESET)\n"
	@$(DOCKER_COMPOSE) ps $(VAULT_CONTAINER) | sed 's/^/  /'
	@printf "\n$(BOLD)🔐 STATUS DO VAULT:$(RESET)\n"
	@docker exec $(VAULT_CONTAINER) vault status -format=json 2>/dev/null | \
	    jq -r '. | "  Inicializado: \(.initialized)\n  Selado: \(.sealed)\n  Versão: \(.version)\n  Tipo de Storage: \(.storage_type)\n  Cluster: \(.cluster_name)\n  HA Ativado: \(.ha_enabled)"' 2>/dev/null || \
	    (printf "$(RED)✗ Erro ao obter status do Vault$(RESET)\n" && exit 1)
	@printf "\n$(BOLD)🌐 ENDPOINTS:$(RESET)\n"
	@printf "  UI: http://localhost:8200\n"
	@printf "  API: http://localhost:8200/v1/\n"
	@if [ -f $(ENV_FILE) ]; then \
		printf "\n$(BOLD)🔑 CREDENCIAIS:$(RESET)\n"; \
		printf "  Root Token: "; \
		grep VAULT_ROOT_TOKEN $(ENV_FILE) | cut -d'=' -f2; \
		printf "  Service Token: "; \
		grep VAULT_TOKEN $(ENV_FILE) | cut -d'=' -f2; \
	fi
	@printf "\n$(GREEN)✓ Vault está operacional!$(RESET)\n"

restart: ## Reinicia o container do Vault mantendo os dados
	$(call log_info,"Reiniciando container do Vault...")
	@$(DOCKER_COMPOSE) restart $(VAULT_CONTAINER)
	$(call log_success,"Container reiniciado!")
	$(call log_warning,"Execute 'make setup' caso o Vault esteja selado.")

clean: ## Para o container e remove volumes (⚠️ Destrutivo!)
	$(call log_warning,"ATENÇÃO: Isso removerá TODOS os dados do Vault!")
	@read -p "$(YELLOW)Tem certeza que deseja continuar? [y/N]:$(RESET) " confirm && \
		[ "$${confirm:-N}" = "y" ] || exit 1
	@$(DOCKER_COMPOSE) down -v
	@rm -rf $(DATA_DIR)
	@rm -f $(ENV_FILE)
	$(call log_success,"Ambiente limpo com sucesso!")

check: ## Verifica a conexão com o Vault usando o token atual
	$(call log_info,"Verificando conexão com o Vault...")
	$(call check_env_file)
	@if [ -f $(ENV_FILE) ]; then \
		export $$(cat $(ENV_FILE) | grep -v "^#" | xargs); \
		if docker exec $(VAULT_CONTAINER) vault token lookup -format=table; then \
			$(call log_success,"Conexão estabelecida com sucesso!"); \
		else \
			$(call log_error,"Erro na conexão com o Vault"); \
			exit 1; \
		fi \
	fi

init: ## Apenas inicializa o container sem configurar
	$(call log_info,"Iniciando container do Vault...")
	@$(DOCKER_COMPOSE) up -d $(VAULT_CONTAINER)
	$(call log_success,"Container iniciado!")
	$(call log_info,"Use 'make setup' para configurar o Vault.")

shell: ## Abre um shell dentro do container do Vault
	$(call log_info,"Abrindo shell no container do Vault...")
	@docker exec -it $(VAULT_CONTAINER) sh

view-token: ## Mostra o token de serviço atual do Vault
	$(call check_env_file)
	$(call log_info,"Token de serviço do Vault:")
	@grep VAULT_TOKEN $(ENV_FILE) | cut -d'=' -f2

view-env: ## Mostra todas as variáveis de ambiente configuradas
	$(call check_env_file)
	$(call log_info,"Variáveis de ambiente disponíveis:")
	@cat $(ENV_FILE) | grep -v "^#"

backup: ## Cria um backup das configurações do Vault
	$(call log_info,"Criando backup das configurações...")
	@mkdir -p $(DATA_DIR)/backup
	@cp $(ENV_FILE) $(DATA_DIR)/backup/.env.backup
	@cp -r $(DATA_DIR)/*.* $(DATA_DIR)/backup/
	$(call log_success,"Backup criado em $(DATA_DIR)/backup!")

restore: ## Restaura um backup das configurações do Vault
	$(call log_warning,"Restaurando backup das configurações...")
	@if [ -d "$(DATA_DIR)/backup" ]; then \
		cp $(DATA_DIR)/backup/.env.backup $(ENV_FILE); \
		cp -r $(DATA_DIR)/backup/*.* $(DATA_DIR)/; \
		$(call log_success,"Backup restaurado com sucesso!"); \
	else \
		$(call log_error,"Backup não encontrado em $(DATA_DIR)/backup"); \
		exit 1; \
	fi 