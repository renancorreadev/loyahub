FROM golang:1.22-alpine AS builder

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache gcc musl-dev git

# Copiar módulos
COPY go.mod ./
COPY go.sum ./

# Baixar dependências
RUN go mod download

# Copiar código fonte
COPY . .

# Construir o aplicativo
RUN go build -o indexer ./cmd/indexer

FROM alpine:3.18

WORKDIR /app

# Instalar certificados CA
RUN apk add --no-cache ca-certificates tzdata && update-ca-certificates

# Copiar o binário compilado
COPY --from=builder /app/indexer .

# Configurar o ambiente
ENV TZ=UTC \
    RPC_URL="http://localhost:8545" \
    WS_URL="ws://localhost:8546" \
    DB_HOST="localhost" \
    DB_PORT="5432" \
    DB_USER="postgres" \
    DB_PASSWORD="postgres" \
    DB_NAME="indexer" \
    RABBITMQ_URL="amqp://guest:guest@localhost:5672/" \
    API_PORT="8080" \
    CONFIRMATIONS_REQUIRED="12" \
    BLOCKS_PER_BATCH="100" \
    MAX_WORKERS="5" \
    LOG_LEVEL="info"

EXPOSE 8080

CMD ["./indexer"] 