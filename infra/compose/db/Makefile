# Makefile para gerenciamento do PostgreSQL
.PHONY: help setup reset status restart clean check init shell create-db list-db backup restore

# Variáveis
SCRIPTS_DIR = ./scripts
DOCKER_COMPOSE = docker-compose
DB_SERVICE = loyahub_db
DB_CONTAINER = loyahub_db
DB_ADMIN_USER = root
DB_ADMIN_NAME = loyahub_db
DB_USER = loyahub
DB_NAME = loyahub_db
BACKUP_DIR = ./backups

# Cores para output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "${YELLOW}Makefile para gerenciamento do PostgreSQL${NC}"
	@echo ""
	@echo "${GREEN}Comandos disponíveis:${NC}"
	@echo "  ${YELLOW}make setup${NC}        - Configura o PostgreSQL"
	@echo "  ${YELLOW}make reset${NC}        - Remove todos os dados e reinicia o PostgreSQL (⚠️ Cuidado!)"
	@echo "  ${YELLOW}make status${NC}       - Verifica o status atual do PostgreSQL"
	@echo "  ${YELLOW}make restart${NC}      - Reinicia o container do PostgreSQL"
	@echo "  ${YELLOW}make clean${NC}        - Para o container e remove volumes (⚠️ Cuidado!)"
	@echo "  ${YELLOW}make check${NC}        - Verifica a conexão com o PostgreSQL"
	@echo "  ${YELLOW}make init${NC}         - Apenas inicializa o container sem configurar"
	@echo "  ${YELLOW}make shell${NC}        - Abre um shell psql dentro do container"
	@echo "  ${YELLOW}make admin-shell${NC}  - Abre um shell psql como admin"
	@echo "  ${YELLOW}make create-db${NC}    - Cria um novo banco de dados"
	@echo "  ${YELLOW}make list-db${NC}      - Lista os bancos de dados existentes"
	@echo "  ${YELLOW}make backup${NC}       - Cria um backup do banco de dados"
	@echo "  ${YELLOW}make restore${NC}      - Restaura um backup do banco de dados"
	@echo ""
	@echo "${RED}⚠️  Atenção:${NC} Os comandos 'reset' e 'clean' removem todos os dados!"

setup:
	@echo "${GREEN}Configurando o PostgreSQL...${NC}"
	@chmod +x $(SCRIPTS_DIR)/setup-db.sh
	@$(SCRIPTS_DIR)/setup-db.sh

reset:
	@echo "${RED}⚠️ Atenção: Isso removerá TODOS os dados do PostgreSQL!${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	  [ $${confirm:-n} = "y" ] || exit 1
	@chmod +x $(SCRIPTS_DIR)/reset-db.sh
	@$(SCRIPTS_DIR)/reset-db.sh
	@$(MAKE) setup

status:
	@echo "${GREEN}Verificando status do PostgreSQL...${NC}"
	@$(DOCKER_COMPOSE) ps $(DB_SERVICE)
	@docker exec $(DB_CONTAINER) pg_isready -h localhost || echo "${RED}PostgreSQL não está respondendo${NC}"

restart:
	@echo "${YELLOW}Reiniciando o container do PostgreSQL...${NC}"
	@$(DOCKER_COMPOSE) restart $(DB_SERVICE)
	@echo "${GREEN}Container reiniciado.${NC}"
	@sleep 5
	@docker exec $(DB_CONTAINER) pg_isready -h localhost || echo "${RED}PostgreSQL não está respondendo após reinicialização${NC}"

clean:
	@echo "${RED}⚠️ Atenção: Isso removerá TODOS os dados do PostgreSQL!${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	  [ $${confirm:-n} = "y" ] || exit 1
	@$(DOCKER_COMPOSE) down -v
	@echo "${GREEN}Container parado e volumes removidos.${NC}"

check:
	@echo "${GREEN}Verificando conexão com o PostgreSQL...${NC}"
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c "SELECT version();" || echo "${RED}Erro na conexão${NC}"

init:
	@echo "${YELLOW}Iniciando apenas o container do PostgreSQL...${NC}"
	@$(DOCKER_COMPOSE) up -d $(DB_SERVICE)
	@echo "${GREEN}Container iniciado. Use 'make setup' para configurar completamente.${NC}"

shell:
	@echo "${GREEN}Abrindo shell psql no container do PostgreSQL...${NC}"
	@docker exec -it $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME)

admin-shell:
	@echo "${GREEN}Abrindo shell psql como administrador...${NC}"
	@docker exec -it $(DB_CONTAINER) psql -U $(DB_ADMIN_USER) -d $(DB_ADMIN_NAME)

create-db:
	@echo "${YELLOW}Criando um novo banco de dados...${NC}"
	@read -p "Digite o nome do novo banco de dados: " db_name && \
	  docker exec $(DB_CONTAINER) psql -U $(DB_ADMIN_USER) -c "CREATE DATABASE $${db_name};" && \
	  echo "${GREEN}Banco de dados $${db_name} criado com sucesso!${NC}" || \
	  echo "${RED}Erro ao criar o banco de dados${NC}"

list-db:
	@echo "${GREEN}Listando bancos de dados existentes:${NC}"
	@docker exec $(DB_CONTAINER) psql -U $(DB_ADMIN_USER) -c "\l"

backup:
	@echo "${YELLOW}Criando backup do banco de dados...${NC}"
	@mkdir -p $(BACKUP_DIR)
	@NOW=$$(date +%Y%m%d_%H%M%S); \
	  docker exec $(DB_CONTAINER) pg_dump -U $(DB_USER) -d $(DB_NAME) -F c > $(BACKUP_DIR)/$(DB_NAME)_$${NOW}.dump && \
	  echo "${GREEN}Backup criado: $(BACKUP_DIR)/$(DB_NAME)_$${NOW}.dump${NC}" || \
	  echo "${RED}Erro ao criar backup${NC}"

restore:
	@echo "${YELLOW}Restaurando backup do banco de dados...${NC}"
	@if [ -d "$(BACKUP_DIR)" ]; then \
	  ls -1 $(BACKUP_DIR) | grep -E '\.dump$$' | nl -s ') '; \
	  read -p "Escolha o número do backup para restaurar: " num && \
	  BACKUP_FILE=$$(ls -1 $(BACKUP_DIR) | grep -E '\.dump$$' | sed -n "$${num}p"); \
	  if [ -n "$$BACKUP_FILE" ]; then \
	    echo "${RED}⚠️ Atenção: Isso substituirá TODOS os dados do banco $(DB_NAME)!${NC}"; \
	    read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	    [ "$${confirm}" = "y" ] && \
	    docker exec -i $(DB_CONTAINER) pg_restore -U $(DB_USER) -d $(DB_NAME) -c < $(BACKUP_DIR)/$${BACKUP_FILE} && \
	    echo "${GREEN}Backup restaurado com sucesso!${NC}" || \
	    echo "${RED}Restauração cancelada ou falhou${NC}"; \
	  else \
	    echo "${RED}Backup inválido selecionado${NC}"; \
	  fi; \
	else \
	  echo "${RED}Diretório de backups não encontrado${NC}"; \
	  mkdir -p $(BACKUP_DIR); \
	fi 