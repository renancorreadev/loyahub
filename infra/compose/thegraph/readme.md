# TheGraph - DREX Subgraph

O Subgraph serve para indexar os dados do blockchain e disponibilizar uma API GraphQL para acesso aos dados.

## Estrutura do Subgraph

O Subgraph é composto por três partes principais:

1. **Subgraph Code**: Contém a lógica de negócios do subgraph, escrita em GraphQL SDL.
2. **Mapping**: Contém a lógica de mapeamento dos dados do blockchain para o formato do subgraph.
3. **Template**: Contém a estrutura do subgraph, incluindo os templates de queries e mutations.

## Configurações Iniciais

1. Inicializar o subgraph:
```bash
graph init --studio drex \
  --from-contract 0x640c974A4d1cF06d9b0c15669c50eE1D62fA7C14 \
  --network private \
  --node http://localhost:8020/ \
  --abi ./abi/Drex.json \
  --allow-simple-name
```

2. Criar o subgraph:
```bash
graph create --node http://localhost:8020/ drex
```

3. Implantar o subgraph:
```bash
graph deploy \
  --node http://localhost:8020/ \
  --ipfs http://localhost:5001/ \
  drex
```

4. Gerar código e inicializar:
```bash
cd Drex
graph codegen
bash init.sh
```

## Exemplos de Queries GraphQL

### 1. Consulta Básica de Transferências
```graphql
{
  transfers(
    first: 5
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    from
    to
    value
    blockTimestamp
    transactionHash
  }
}
```

### 2. Consulta de Aprovações
```graphql
{
  approvals(
    first: 5
    orderBy: value
    orderDirection: desc
  ) {
    id
    owner
    spender
    value
    blockTimestamp
  }
}
```

### 3. Consulta com Filtros
```graphql
{
  transfers(
    where: {
      value_gt: "1000000000000000000"  # Valor maior que 1 DREX
      blockTimestamp_gt: "1700000000"   # Timestamp após uma data específica
    }
  ) {
    from
    to
    value
    blockTimestamp
  }
}
```

### 4. Consulta Combinada
```graphql
{
  approvals(first: 3) {
    owner
    spender
    value
  }
  transfers(first: 3) {
    from
    to
    value
  }
}
```

## Consulta via cURL

Exemplo de consulta usando cURL:
```bash
curl -X POST http://localhost:8000/subgraphs/name/drex \
  -H "Content-Type: application/json" \
  --data '{
    "query": "{ 
      transfers(first: 5) { 
        id 
        from 
        to 
        value 
        blockTimestamp 
      } 
    }"
  }'
```

## Filtros Disponíveis

- **Paginação**:
  - `first`: Número de registros
  - `skip`: Quantidade de registros para pular

- **Ordenação**:
  - `orderBy`: Campo para ordenação
  - `orderDirection`: `asc` ou `desc`

- **Filtros numéricos**:
  - `_gt`: Maior que
  - `_lt`: Menor que
  - `_gte`: Maior ou igual
  - `_lte`: Menor ou igual

- **Filtros de texto/endereço**:
  - `_contains`: Contém
  - `_not`: Não igual
  - `_in`: Em uma lista de valores

## Playground GraphQL

Acesse o playground GraphQL em: http://localhost:8000/graphql

## Monitoramento

- **Graph Node**: http://localhost:8000
- **IPFS**: http://localhost:5001
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000