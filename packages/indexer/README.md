# Blockchain Indexer

Indexador universal de contratos ERC20 na blockchain, usando Go, RabbitMQ e PostgreSQL.

## Funcionalidades

- Indexa **qualquer** token ERC20 automaticamente
- Monitora transferências e aprovações em tempo real
- Armazena todos os eventos em banco de dados relacional
- Oferece API REST para consulta de dados
- Trabalha com filas para processamento assíncrono
- Compatível com qualquer blockchain compatível com Ethereum
- Resiliência a falhas e reconexão automática

## Requisitos

- Go 1.22+
- PostgreSQL 14+
- RabbitMQ 3.11+
- Node RPC/WSS de uma blockchain Ethereum-compatible

## Executando com Docker

A forma mais simples de executar o indexador é usando Docker Compose:

```bash
# Configurar conexão RPC
export RPC_URL=http://localhost:8545
export WS_URL=ws://localhost:8546

# Iniciar os serviços
docker-compose up -d
```

## Configuração Manual

1. Clone o repositório:
```bash
git clone https://github.com/loyahub/indexer
cd indexer
```

2. Instale as dependências:
```bash
go mod download
```

3. Configure o `.env`:
```bash
cp .env.example .env
# Edite as configurações conforme necessário
```

4. Execute o PostgreSQL e RabbitMQ:
```bash
docker-compose up -d postgres rabbitmq
```

5. Execute o indexador:
```bash
go run cmd/indexer/main.go
```

## API REST

O indexador expõe uma API REST na porta 8080:

### Endpoints principais:

- `GET /api/v1/tokens` - Lista tokens indexados
- `GET /api/v1/tokens/{address}` - Detalhes de um token
- `POST /api/v1/tokens` - Adiciona um novo token para indexação
- `GET /api/v1/transfers` - Lista transferências (com filtros)
- `GET /api/v1/approvals` - Lista aprovações (com filtros)
- `GET /api/v1/balances/{token}/{owner}` - Obtém saldo

## Indexando um novo token

Para adicionar um novo token:

```bash
curl -X POST http://localhost:8080/api/v1/tokens \
  -H "Content-Type: application/json" \
  -d '{"address":"0x452cdd0B9fe8c0300582b4185Efb82afce7f6820"}'
```

## Estrutura do Projeto

```
indexer/
├── cmd/                 # Entrypoints
│   └── indexer/         # Aplicação principal
├── pkg/                 # Pacotes internos
│   ├── api/             # API REST
│   ├── blockchain/      # Conexão com blockchain
│   ├── config/          # Configurações
│   ├── db/              # Acesso ao banco de dados
│   ├── models/          # Modelos de dados
│   ├── queue/           # Filas RabbitMQ
│   ├── utils/           # Utilitários diversos
│   └── abis/            # ABIs de contratos
├── docker-compose.yml   # Configuração Docker
├── Dockerfile           # Imagem Docker
└── go.mod               # Dependências Go
```

## Desenvolvimento

### Compilação

```bash
go build -o indexer cmd/indexer/main.go
```

### Testes

```bash
go test ./...
```

## Licença

MIT 