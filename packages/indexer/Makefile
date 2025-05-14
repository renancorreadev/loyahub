.PHONY: build run test up down lint

# Variáveis
APP_NAME := indexer
BUILD_DIR := build

# Comandos principais
build:
	@echo "Compilando aplicação..."
	go build -o $(BUILD_DIR)/$(APP_NAME) ./cmd/indexer

run:
	@echo "Executando aplicação..."
	go run ./cmd/indexer

test:
	@echo "Executando testes..."
	go test ./...

lint:
	@echo "Executando linter..."
	golangci-lint run

# Docker
up:
	@echo "Iniciando serviços com Docker..."
	docker-compose up -d

down:
	@echo "Parando serviços Docker..."
	docker-compose down

# Utilidades
deps:
	@echo "Baixando dependências..."
	go mod download

tidy:
	@echo "Arrumando dependências..."
	go mod tidy

clean:
	@echo "Limpando build..."
	rm -rf $(BUILD_DIR)

# Configuração
init:
	@echo "Inicializando ambiente de desenvolvimento..."
	cp -n .env.example .env || true
	mkdir -p $(BUILD_DIR)
	go mod tidy
	@echo "Ambiente inicializado com sucesso!"

# Docker específicos
postgres-cli:
	docker-compose exec postgres psql -U postgres -d indexer

logs:
	docker-compose logs -f

help:
	@echo "Comandos disponíveis:"
	@echo "  make build       - Compila a aplicação"
	@echo "  make run         - Executa a aplicação localmente"
	@echo "  make test        - Executa os testes"
	@echo "  make lint        - Executa o linter"
	@echo "  make up          - Inicia serviços com Docker"
	@echo "  make down        - Para serviços Docker"
	@echo "  make deps        - Baixa dependências"
	@echo "  make tidy        - Arruma dependências"
	@echo "  make clean       - Limpa arquivos de build"
	@echo "  make init        - Inicializa ambiente de desenvolvimento"
	@echo "  make postgres-cli - Acesso ao CLI do PostgreSQL"
	@echo "  make logs        - Exibe logs dos containers" 