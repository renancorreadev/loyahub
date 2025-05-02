# Makefile para gerenciamento do Vault
.PHONY: help setup reset status restart clean check init shell view-token view-env

# Variáveis
SCRIPTS_DIR = ./scripts
DOCKER_COMPOSE = docker-compose
VAULT_CONTAINER = vault

# Cores para output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "${YELLOW}Makefile para gerenciamento do Vault${NC}"
	@echo ""
	@echo "${GREEN}Comandos disponíveis:${NC}"
	@echo "  ${YELLOW}make setup${NC}        - Configura o Vault do zero mantendo dados existentes"
	@echo "  ${YELLOW}make reset${NC}        - Remove todos os dados e reinicia o Vault (⚠️ Cuidado!)"
	@echo "  ${YELLOW}make status${NC}       - Verifica o status atual do Vault"
	@echo "  ${YELLOW}make restart${NC}      - Reinicia o container do Vault"
	@echo "  ${YELLOW}make clean${NC}        - Para o container e remove volumes (⚠️ Cuidado!)"
	@echo "  ${YELLOW}make check${NC}        - Verifica a conexão com o Vault"
	@echo "  ${YELLOW}make init${NC}         - Apenas inicializa o container sem configurar"
	@echo "  ${YELLOW}make shell${NC}        - Abre um shell dentro do container do Vault"
	@echo "  ${YELLOW}make view-token${NC}   - Mostra o token de serviço atual do Vault"
	@echo "  ${YELLOW}make view-env${NC}     - Mostra as variáveis de ambiente disponíveis"
	@echo ""
	@echo "${RED}⚠️  Atenção:${NC} Os comandos 'reset' e 'clean' removem todos os dados!"

setup:
	@echo "${GREEN}Configurando o Vault...${NC}"
	@chmod +x $(SCRIPTS_DIR)/setup-vault.sh
	@$(SCRIPTS_DIR)/setup-vault.sh

reset:
	@echo "${RED}⚠️ Atenção: Isso removerá TODOS os dados do Vault!${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	  [ $${confirm:-n} = "y" ] || exit 1
	@chmod +x $(SCRIPTS_DIR)/reset-vault.sh
	@$(SCRIPTS_DIR)/reset-vault.sh
	@$(MAKE) setup

status:
	@echo "${GREEN}Verificando status do Vault...${NC}"
	@$(DOCKER_COMPOSE) ps $(VAULT_CONTAINER)
	@docker exec $(VAULT_CONTAINER) vault status || echo "${RED}Container não está rodando ou Vault não inicializado${NC}"

restart:
	@echo "${YELLOW}Reiniciando o container do Vault...${NC}"
	@$(DOCKER_COMPOSE) restart $(VAULT_CONTAINER)
	@echo "${GREEN}Container reiniciado. Execute 'make setup' caso o Vault esteja selado.${NC}"

clean:
	@echo "${RED}⚠️ Atenção: Isso removerá TODOS os dados do Vault!${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	  [ $${confirm:-n} = "y" ] || exit 1
	@$(DOCKER_COMPOSE) down -v
	@echo "${GREEN}Container parado e volumes removidos.${NC}"

check:
	@echo "${GREEN}Verificando conexão com o Vault...${NC}"
	@if [ -f .env ]; then \
		export $$(cat .env | grep -v "^#" | xargs); \
		docker exec $(VAULT_CONTAINER) vault token lookup -format=table || echo "${RED}Erro na conexão${NC}"; \
	else \
		echo "${RED}Arquivo .env não encontrado. Execute 'make setup' primeiro.${NC}"; \
	fi

init:
	@echo "${YELLOW}Iniciando apenas o container do Vault...${NC}"
	@$(DOCKER_COMPOSE) up -d $(VAULT_CONTAINER)
	@echo "${GREEN}Container iniciado. Use 'make setup' para configurar o Vault.${NC}"

shell:
	@echo "${GREEN}Abrindo shell no container do Vault...${NC}"
	@docker exec -it $(VAULT_CONTAINER) sh

view-token:
	@if [ -f .env ]; then \
		echo "${GREEN}Token de serviço do Vault:${NC}"; \
		grep VAULT_TOKEN .env | cut -d'=' -f2; \
	else \
		echo "${RED}Arquivo .env não encontrado. Execute 'make setup' primeiro.${NC}"; \
	fi

view-env:
	@if [ -f .env ]; then \
		echo "${GREEN}Variáveis de ambiente disponíveis:${NC}"; \
		cat .env | grep -v "^#"; \
	else \
		echo "${RED}Arquivo .env não encontrado. Execute 'make setup' primeiro.${NC}"; \
	fi 