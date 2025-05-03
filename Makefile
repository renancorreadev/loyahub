# Makefile para gerenciamento do projeto LoyaHub
.PHONY: help db-reset deploy-sc deploy

# Cores para output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "${YELLOW}Makefile para gerenciamento do projeto LoyaHub${NC}"
	@echo ""
	@echo "${GREEN}Comandos disponíveis:${NC}"
	@echo "  ${YELLOW}make db-reset${NC}             - Reseta tabelas específicas do banco de dados"
	@echo "  ${YELLOW}make deploy-sc${NC}            - Deploy de todos os contratos inteligentes"
	@echo "  ${YELLOW}make deploy${NC}               - Executa o deploy completo (DB reset + smart contracts)"
	@echo ""
	@echo "${RED}⚠️  Atenção:${NC} Os comandos de reset limpam os dados das tabelas especificadas!"

db-reset:
	@echo "${YELLOW}Resetando tabelas do banco de dados...${NC}"
	@chmod +x infra/compose/db/scripts/reset-tables.sh
	@cd infra/compose/db && ./scripts/reset-tables.sh
	@echo "${GREEN}Reset das tabelas concluído.${NC}"

deploy-sc:
	@echo "${YELLOW}Iniciando deploy dos contratos inteligentes...${NC}"
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh
	@echo "${GREEN}Deploy dos contratos inteligentes concluído.${NC}"

deploy: db-reset deploy-sc
	@echo "${GREEN}Deploy completo concluído com sucesso!${NC}"
	@echo "${YELLOW}O ambiente está pronto para uso.${NC}" 