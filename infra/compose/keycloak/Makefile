# Makefile para gerenciamento do Keycloak
.PHONY: help setup start stop status restart clean logs

# Variáveis
DOCKER_COMPOSE = docker-compose

# Cores para output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "${YELLOW}Makefile para gerenciamento do Keycloak${NC}"
	@echo ""
	@echo "${GREEN}Comandos disponíveis:${NC}"
	@echo "  ${YELLOW}make setup${NC}        - Configura e inicia o Keycloak com os realms pré-configurados"
	@echo "  ${YELLOW}make start${NC}        - Inicia os containers do Keycloak"
	@echo "  ${YELLOW}make stop${NC}         - Para os containers do Keycloak"
	@echo "  ${YELLOW}make status${NC}       - Verifica o status atual dos containers"
	@echo "  ${YELLOW}make restart${NC}      - Reinicia os containers do Keycloak"
	@echo "  ${YELLOW}make clean${NC}        - Para os containers e remove volumes (⚠️ Cuidado!)"
	@echo "  ${YELLOW}make logs${NC}         - Exibe os logs do Keycloak"
	@echo ""
	@echo "${RED}⚠️  Atenção:${NC} O comando 'clean' remove todos os dados do Keycloak!"

setup:
	@echo "${GREEN}Configurando e iniciando o Keycloak...${NC}"
	@echo "${YELLOW}Verificando se os arquivos de configuração existem...${NC}"
	@if [ ! -f "config/master-realm.json" ] || [ ! -f "config/protocol-realm.json" ]; then \
		echo "${RED}Erro: Arquivos de configuração não encontrados!${NC}"; \
		echo "${YELLOW}Certifique-se de que os arquivos estão em ./config/master-realm.json e ./config/protocol-realm.json${NC}"; \
		exit 1; \
	fi
	@echo "${YELLOW}Iniciando containers...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Keycloak configurado e iniciado!${NC}"
	@echo "${YELLOW}Aguarde alguns instantes enquanto o Keycloak importa os realms...${NC}"
	@echo "${YELLOW}Acesse a interface web em: http://localhost:8080${NC}"

start:
	@echo "${GREEN}Iniciando containers do Keycloak...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Containers iniciados.${NC}"
	@echo "${YELLOW}Acesse a interface web em: http://localhost:8080${NC}"

stop:
	@echo "${YELLOW}Parando containers do Keycloak...${NC}"
	@$(DOCKER_COMPOSE) stop
	@echo "${GREEN}Containers parados.${NC}"

status:
	@echo "${GREEN}Verificando status dos containers do Keycloak...${NC}"
	@$(DOCKER_COMPOSE) ps

restart:
	@echo "${YELLOW}Reiniciando containers do Keycloak...${NC}"
	@$(DOCKER_COMPOSE) restart
	@echo "${GREEN}Containers reiniciados.${NC}"

clean:
	@echo "${RED}⚠️ Atenção: Isso removerá TODOS os dados do Keycloak!${NC}"
	@read -p "Tem certeza que deseja continuar? (y/n): " confirm && \
	  [ $${confirm:-n} = "y" ] || exit 1
	@echo "${YELLOW}Parando containers e removendo volumes...${NC}"
	@$(DOCKER_COMPOSE) down -v
	@echo "${GREEN}Limpeza concluída.${NC}"

logs:
	@echo "${GREEN}Exibindo logs do Keycloak (Ctrl+C para sair)...${NC}"
	@$(DOCKER_COMPOSE) logs -f keycloak 