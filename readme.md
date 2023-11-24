# Client Manager on Blockchain Technology 

## Visão Geral
O projeto **Client Manager on Blockchain Technology** é uma solução desenvolvida para otimizar a gestão de clientes com pontuação e emitir tokens de benefícios no ecossistema de blockchain privada. Utilizando **Hyperledger Besu** para gerenciar rede privada com o protocolo QBFT em conjunto com uma aplicação back-end equipada com os recursos das capacidades avançadas do [NestJS](https://nestjs.com/), um framework para aplicações server-side em Node.js, este projeto possui todos pacotes (packages) incorporados na arquitetura hexagonal com inversão de dependências, garantindo um design modular e de fácil manutenção.

## Interação com a Blockchain
A essência do projeto reside na sua capacidade de interagir com a blockchain, permitindo o monitoramento e reação a eventos específicos da rede. Isso é alcançado por meio de um micro-serviço dedicado, que escuta eventos na blockchain e executa ações correspondentes, como a atualização de registros de clientes, emissão de pontos para determinado cliente, emissão de tokens baseado em NFTs para representar uma `insignia` ou nível `level` em que um cliente se encontra dependendo do saldo de pontos que esse indivíduo possui.

## Gerenciamento de Metadados de NFTs
Uma característica central do sistema é o gerenciamento de metadados de NFTs, essencial para o registro, adição de pontos e atualização dos níveis dos clientes (`1` | `2` | `3`). Os NFTs são usados para representar diferentes níveis de clientes, como (`CUSTOMER_PREMIUM` | `CUSTOMER_GOLD` | `CUSTOMER_TITANIUM`), cada um com benefícios exclusivos. Os clientes acumulam pontos através de interações e compras, e esses pontos determinam o nível do NFT que lhes é atribuído. A mudança de níveis é refletida automaticamente pelo micro-serviço desenvolvido em go nos metadados do NFT correspondente, assegurando uma representação precisa do status do cliente.

> Aqui tem um exemplo de como é definidido as Metadata pelo tokenID de um usuario: 

```json
{
  "tokenID": 2,
  "customer": "John Doe dos Santos",
  "description": "Você está no nível I com a insígnia Customer Premium",
  "image": "https://meusite.com/imagens/nft/1.png",
  "insight": "CUSTOMER_PREMIUM",
  "attributes": {
    "points": 240,
    "level": 1,
    "benefits": [
      {
        "level_type": "Nível",
        "value": 1
      },
      {
        "nft_type": "NFT",
        "value": "CUSTOMER_TITANIUM"
      },
      {
        "benefit_type": "Benefits",
        "value": [
          {
            "discount": "20%",
            "description": "Desconto de 20% em todos os produtos."
          },
          {
            "FreeFrete": "Frete GRATIS",
            "description": "Frete GRATIS no seu estado."
          },
          {
            "description": "Com esse benefício voce tem acesso ao nivel 1 do catalogo de promoção",
            "promotionLevel3": "Promoção nivel 1"
          }
        ]
      }
    ]
  },
  "databaseId": 8,
  "createdAt": "2023-11-23T16:43:47.683Z",
  "updatedAt": "2023-11-23T16:43:47.683Z"
}
```
## API HTTP e Swagger
O sistema também conta com uma API HTTP integrada para gerenciar os metadados dos NFTs. Isso inclui endpoints para consulta e atualização dos metadados baseados nos tokenIDs. A integração com o Swagger oferece uma documentação clara e interativa da API, facilitando o uso e a integração por parte dos desenvolvedores.

> Abaixo você pode ver uma breve ilustração: 
![Swagger](docs/images/swagger-v1.png)

## Tecnologias 

<div style="text-align: center;">
  <img src="https://raw.githubusercontent.com/hyperledger/firefly/main/images/hyperledger_firefly_logo.png" alt="Hyperledger" style="width: 200px; height: 90px; margin: 1rem;">
  <img src="https://github.com/remojansen/logo.ts/raw/master/ts.png" alt="TypeScript" style="width: 120px; height: 90px; margin: 1rem;">
  <img src="https://github.com/rfyiamcool/golang_logo/raw/master/png/golang_58.png" alt="Go" style="width: 180px; height: 90px; margin: 1rem;">
  <img src="https://nestjs.com/img/logo-small.svg" alt="NestJS" style="width: 150px; height: 90px; margin: 1rem;">
</div>

- NestJs
- Golang
- React
- Typescript
- Solidity
- PostgreeSQL
- TypeOrm
- EthereumGo

## Ciclo de nova Feature: 

> O Planejamento para desenvolvimento de uma nova feature para esse projeto com um longo escopo está definida para seguir esse padrão abaixo: 

![Alt text](docs/images/plainning.png)

1. Inicia se o desenvolvimento da feature na blockckchain com os contratos inteligentes que são atualizaveis com o  
ERC1967Proxy.
1. Parte para o desenvolvimento da solução da feature na escuta dos eventos com o micro serviço desenvolvido em Go para gerenciamento de eventos e acionamentos de cronJobs. 
2. Parte se para o desenvolvimento da solução da feature para o back-end, desenvolvendo-se os casos de uso, rotas, entidades e dominios para se atender. 
3. Parte se para o desenvolvimento da solução no front end no React. 


## Estrutura de pastas
> O projeto é um projeto monorepo baseado em projetos descentralizados de blockchain mas com enfase em blockchain privada. 
> Temos esse domínios de pastas: 

```log
monoRepo/
├─ docs/
├─ packages/
│    ├── blockchain-service
│    │   ├── package.json
│    ├── client-manager-api
│    │   ├── package.json
│    ├── client-manager-ui
│    │   ├── package.json
│    ├── smart-contracts
│    │   ├── package.json
├── package.json
```
- O Projeto está sendo gerenciado pelo lerna, existem alguns scripts para serem executados na execução do projeto: 

```file
monoRepo/
├─ docs/
├─ packages/
├── package.json
```

```json
 "scripts": {
    "start:dev": "lerna run --parallel --stream dev --scope client-manager-api --scope client-manager-ui --scope blockchain-service",
    "dev": "lerna run --parallel --stream dev --scope client-manager-api --scope client-manager-ui",
    "sc": "lerna run --scope smart-contracts compile",
    "bs": "lerna run --scope blockchain-service --stream dev",
    "api": "lerna run --scope client-manager-api --stream dev",
    "ui": "lerna run --scope client-manager-ui --stream dev",
    "clean": "lerna run clean",
    "build": "pnpm recursive run build",
    "test": "pnpm recursive run test"
  },
```

| Comando      | Descrição                                                                                               |
|--------------|---------------------------------------------------------------------------------------------------------|
| `start:dev`  | Executa paralelamente todos os aplicativos relacionados ao protocolo de gerenciamento de clientes (API, UI, e serviço blockchain). |
| `dev`        | Executa paralelamente a API e a UI do gerenciador de clientes.                                          |
| `sc`         | Executa o comando de compilação no projeto de smart contracts.                                         |
| `bs`         | Executa o micro serviço blockchain.                                                                           |
| `api`        | Executa a API do gerenciador de clientes.                                                               |
| `ui`         | Executa a interface do usuário (UI) do gerenciador de clientes.                                         |
| `clean`      | Executa o comando de limpeza em todos os pacotes do monorepo.                                           |
| `build`      | Executa o comando de build em todos os pacotes do monorepo de forma recursiva.                          |
| `test`       | Executa testes em todos os pacotes do monorepo de forma recursiva.                                      |


# Desenvolvimento

## 📌 Pendências
- [ ] Definir lógica para remoção automática de 20% dos pontos após 30 dias.

## 🚀 Em Progresso
- [ ] Integrar banco de dados PostGree no Micro Serviço Go

## ✅ Concluídas
- [x] Configurar ambiente de desenvolvimento inicial.
- [x] Subir ambiente blockchain com Hyperledger Besu e Firefly
- [x] Configurar monoRepo e scripts com o lerna
- [x] Revisar e validar estruturas existentes no contrato `ClientManager.sol`.
- [x] Estabelecer sistema de cadastro e gerenciamento de pontos dos clientes.
- [x] Desenvolver integração de pontuação com ERC1155.
- [x] Criar tokens NFT para insígnias (PremiumCustomer, GoldCustomer, TitaniumCustomer).
- [x] Tornar a porcentagem de remoção de pontos ajustável pelo administrador do contrato.
- [x] Implementar testes automatizados para novas funcionalidades.
- [x] Desenvolvimento de todos testes unitarios 
- [x] Implementar Rotas no Back-end API
- [x] Integrar banco de dados PostGree no backEnd
- [x] Implementar API de Metadatas dos tokens ERC1155 das insignas 
- [x] Implementar função para atualizar metadata do NFT conforme níveis de pontuação.
- [x] Implementar rotas para deletar e update metadata do NFT na api.

## 🧠 Ideias para Explorar
- [ ] Investigar integrações com sistemas CRM para uso de metadata.
- [ ] Explorar possibilidades de gamificação no sistema de pontos.
- [ ] Avaliar interoperabilidade com outros contratos inteligentes.

## 🛠️ Melhorias Futuras
- [ ] Otimizar funções para maior eficiência de gás.


## 📚 Documentação
- [ ] Atualizar documentação com detalhes das novas funcionalidades.
- [ ] Criar guia de uso para a interface de administração de pontos.
