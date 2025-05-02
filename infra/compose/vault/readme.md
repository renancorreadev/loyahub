# LoyaHub Vault - Gerenciamento de Segredos

Este diretório contém scripts e configurações para o Vault, um sistema de gerenciamento de segredos usado pelo LoyaHub para armazenar chaves privadas e outros dados sensíveis.

## Visão Geral

O Vault é utilizado pelo serviço `wallet-engine` para armazenar chaves privadas de forma segura. Os scripts neste diretório automatizam a configuração do Vault, garantindo que ele esteja corretamente configurado para uso pela aplicação.

### Componentes Principais

- `scripts/setup-vault.sh`: Script principal para configurar o Vault
- `scripts/reset-vault.sh`: Script para resetar completamente o Vault
- `docker-compose.yml`: Configuração para executar o Vault em um container Docker
- `Makefile`: Facilita a execução de comandos comuns
- `.env`: Arquivo gerado automaticamente com as credenciais necessárias

## Como Usar

### Usando o Makefile (Recomendado)

O projeto inclui um Makefile que simplifica todas as operações:

```bash
# Ver todos os comandos disponíveis
make help

# Configurar o Vault
make setup

# Verificar status
make status

# Ver o token de serviço
make view-token
```

### Configuração Manual

Para configurar o Vault manualmente:

```bash
./scripts/setup-vault.sh
```

Este comando irá:
1. Iniciar o container do Vault
2. Inicializar o Vault com uma única chave de desbloqueio
3. Configurar o secret engine KV-v2 no caminho `/secret`
4. Criar uma política para o serviço wallet
5. Gerar um token de serviço para uso pela aplicação
6. Salvar todas as credenciais no arquivo `.env`

### Reset Completo

Para reiniciar o Vault do zero (remove todos os dados):

```bash
# Usando Makefile
make reset

# Manualmente
./scripts/reset-vault.sh
```

### Reinicialização do Sistema

Ao reiniciar o sistema ou o container do Vault:

```bash
# Usando Makefile
make restart
make setup

# Manualmente
./scripts/setup-vault.sh
```

O script é inteligente o suficiente para detectar que o Vault já está inicializado e irá apenas desbloquá-lo se necessário.

## Comandos do Makefile

| Comando | Descrição |
|---------|-----------|
| `make setup` | Configura o Vault (mantém dados existentes) |
| `make reset` | Remove dados e reinicia o Vault |
| `make status` | Verifica o status atual do Vault |
| `make restart` | Reinicia o container do Vault |
| `make clean` | Para o container e remove volumes |
| `make check` | Verifica a conexão com o Vault |
| `make init` | Apenas inicializa o container |
| `make shell` | Abre um shell dentro do container |
| `make view-token` | Mostra o token de serviço atual |
| `make view-env` | Mostra as variáveis de ambiente |

## Variáveis de Ambiente

O script gera um arquivo `.env` com as seguintes variáveis:

| Variável | Descrição |
|----------|-----------|
| `VAULT_ADDR` | Endereço do Vault (http://localhost:8200) |
| `VAULT_ENDPOINT` | O mesmo que VAULT_ADDR, usado em alguns contextos |
| `VAULT_ROOT_TOKEN` | Token de administrador (root) do Vault |
| `VAULT_UNSEAL_KEY` | Chave para desbloquear o Vault |
| `VAULT_TOKEN` | Token do serviço wallet (usado pela aplicação) |

## Estrutura de Arquivos

Após a configuração, a seguinte estrutura será criada:

```
vault/
├── scripts/
│   ├── setup-vault.sh         # Script de configuração
│   └── reset-vault.sh         # Script de reset
├── data/
│   ├── vault-config.json      # Configuração do Vault
│   ├── vault-init.txt         # Informações de inicialização
│   ├── wallet-policy.hcl      # Política para o serviço wallet
│   └── service-token.txt      # Token do serviço wallet
├── docker-compose.yml         # Configuração do Docker
├── Makefile                   # Facilita a execução de comandos
├── .env                       # Variáveis de ambiente
└── readme.md                  # Esta documentação
```

## Uso na Aplicação

No código do serviço `wallet-engine`, as variáveis de ambiente são usadas para se conectar ao Vault:

```rust
// Exemplo de uso no código Rust
let vault_endpoint = config::get_vault_endpoint(); // Usa VAULT_ENDPOINT
let vault_token = config::get_vault_token();      // Usa VAULT_TOKEN
```

## Interface Web

O Vault possui uma interface web acessível em:

```
http://localhost:8200
```

Use o `VAULT_ROOT_TOKEN` para fazer login.

## Troubleshooting

### O Vault está selado (sealed)

Se o Vault estiver selado após uma reinicialização:

```bash
# Usando Makefile
make setup

# Manualmente
./scripts/setup-vault.sh
```

### Erro de permissão ao acessar o Vault

Verifique se o token no arquivo `.env` é válido:

```bash
# Usando Makefile
make check

# Manualmente
docker exec vault vault token lookup
```

Se inválido, execute `make setup` para gerar um novo token.

### Perda das Credenciais

Se você perder o arquivo `.env` e o diretório `data/`:

```bash
# Usando Makefile
make reset

# Manualmente
./scripts/reset-vault.sh
./scripts/setup-vault.sh
```

## Segurança

⚠️ **IMPORTANTE**:

- Mantenha o arquivo `.env` seguro, ele contém todas as credenciais
- Faça backup do diretório `data/` em um local seguro
- Nunca compartilhe o `VAULT_ROOT_TOKEN` ou `VAULT_UNSEAL_KEY`
- Em ambientes de produção, use múltiplas chaves de desbloqueio (altere o script)

## Notas Adicionais

- O Vault está configurado para usar o modo de armazenamento `file`, adequado para desenvolvimento
- Para ambientes de produção, considere usar backends de armazenamento mais robustos como Consul
- As políticas do Vault estão configuradas para permitir acesso completo apenas no caminho `secret/data/*`
