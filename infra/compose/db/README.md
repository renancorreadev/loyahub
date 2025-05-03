# LoyaHub PostgreSQL - Banco de Dados

Este diretório contém scripts e configurações para o PostgreSQL, o banco de dados utilizado pelo LoyaHub.

## Visão Geral

O PostgreSQL é utilizado como banco de dados principal para os serviços do LoyaHub. Os scripts neste diretório automatizam a configuração e gestão do banco de dados.

### Componentes Principais

- `scripts/setup-db.sh`: Script principal para configurar o PostgreSQL
- `scripts/reset-db.sh`: Script para resetar completamente o PostgreSQL
- `docker-compose.yml`: Configuração para executar o PostgreSQL em um container Docker
- `Makefile`: Facilita a execução de comandos comuns
- `.env`: Arquivo com as credenciais e configurações do banco (gerado automaticamente)

## Como Usar

### Usando o Makefile (Recomendado)

O projeto inclui um Makefile que simplifica todas as operações:

```bash
# Ver todos os comandos disponíveis
make help

# Configurar o PostgreSQL
make setup

# Verificar status
make status

# Acessar o shell do PostgreSQL (aplicação)
make shell

# Acessar o shell do PostgreSQL (admin)
make admin-shell
```

### Configuração Manual

Para configurar o PostgreSQL manualmente:

```bash
./scripts/setup-db.sh
```

Este comando irá:
1. Criar um arquivo `.env` com as configurações necessárias (se não existir)
2. Iniciar o container do PostgreSQL
3. Configurar o banco de dados administrativo `metadataDatabase`
4. Configurar o banco de dados da aplicação `loyahub_db`
5. Configurar os usuários necessários

### Reset Completo

Para reiniciar o PostgreSQL do zero (remove todos os dados):

```bash
# Usando Makefile
make reset

# Manualmente
./scripts/reset-db.sh
```

## Comandos do Makefile

| Comando | Descrição |
|---------|-----------|
| `make setup` | Configura o PostgreSQL |
| `make reset` | Remove dados e reinicia o PostgreSQL |
| `make status` | Verifica o status atual |
| `make restart` | Reinicia o container |
| `make clean` | Para o container e remove volumes |
| `make check` | Verifica a conexão |
| `make init` | Apenas inicializa o container |
| `make shell` | Abre um shell psql da aplicação |
| `make admin-shell` | Abre um shell psql como admin |
| `make create-db` | Cria um novo banco de dados |
| `make list-db` | Lista os bancos de dados existentes |
| `make backup` | Cria um backup do banco de dados |
| `make restore` | Restaura um backup do banco de dados |

## Credenciais Padrão

O PostgreSQL é configurado com dois conjuntos de credenciais:

### Credenciais Administrativas

| Parâmetro | Valor |
|-----------|-------|
| Host | localhost |
| Porta | 5432 |
| Usuário | admin |
| Senha | astronalta |
| Banco de dados | metadataDatabase |

### Credenciais da Aplicação

| Parâmetro | Valor |
|-----------|-------|
| Host | localhost |
| Porta | 5432 |
| Usuário | loyahub |
| Senha | @stro119 |
| Banco de dados | loyahub_db |

Essas credenciais podem ser alteradas editando o arquivo `.env` antes de executar `make setup`.

## Conexão com Serviços

Para conectar um serviço ao PostgreSQL, use as seguintes variáveis de ambiente (disponíveis em `.env.local` após setup):

```
# Para acesso administrativo
DB_ADMIN_USER=admin
DB_ADMIN_PASSWORD=astronalta
DB_ADMIN_NAME=metadataDatabase

# Para a aplicação
DB_HOST=localhost
DB_PORT=5432
DB_USER=loyahub
DB_PASSWORD=loyahub_password
DB_NAME=loyahub_db
```

## Troubleshooting

### Erro na inicialização do PostgreSQL

Se o PostgreSQL não iniciar corretamente:

```bash
# Verifique os logs do container
docker logs db_postgres

# Limpe completamente e reconfigure
make reset
```

### Problemas de conectividade

Se houver problemas de conexão:

```bash
# Verifique se o PostgreSQL está respondendo
make status

# Reinicie o container
make restart
```

### Erro "role does not exist"

Se você encontrar erros relacionados ao usuário não existir:

```bash
# Conecte como usuário admin
make admin-shell

# Crie o usuário manualmente
CREATE USER loyahub WITH PASSWORD 'loyahub_password';
ALTER USER loyahub WITH SUPERUSER;
```

## Backups

É recomendado realizar backups periódicos do banco de dados:

```bash
# Criar um backup
make backup

# Restaurar um backup
make restore
```

Os backups são armazenados no diretório `./backups`. 