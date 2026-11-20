# Infra do Fubika

Tudo sobre como o Fubika roda: arquitetura, ambientes, deploy, rollback, backup e
acesso ao staging. Comandos do dia a dia estão no `make help` (na raiz do repo).

---

## 1. Visão geral

Sete containers, orquestrados por Docker Compose:

| Serviço  | Imagem                            | O que é                                      |
| -------- | --------------------------------- | -------------------------------------------- |
| `caddy`  | `caddy:2.8-alpine`                | Proxy reverso e TLS automático. **Único serviço com portas publicadas.** |
| `bancho` | `ghcr.io/henrique117/fubika-bancho` | Servidor do jogo (bancho.py, Python 3.11)  |
| `api`    | `ghcr.io/henrique117/fubika-api`  | API REST (Fastify + Prisma)                  |
| `web`    | `ghcr.io/henrique117/fubika-web`  | Front React, servido por nginx               |
| `bot`    | `ghcr.io/henrique117/fubika-bot`  | Bot do Discord (Fubas)                       |
| `mysql`  | `mysql:8.0`                       | Banco de dados                               |
| `redis`  | `redis:7.2-alpine`                | Cache e pub/sub entre bancho, API e bot      |
| `backup` | `ghcr.io/henrique117/fubika-backup` | Dump diário do MySQL em `./backups`        |

### Redes

```
                    internet
                       │
                    :80 :443
                       ▼
            ┌──────────────────────┐        rede public_proxy (externa,
            │        caddy         │◄────── só em produção: tickets_app
            └──────────┬───────────┘        e avaliacao_app, de terceiros)
                       │  rede internal (sem portas no host)
   ┌───────────┬───────┴───┬───────────┬──────────┐
   ▼           ▼           ▼           ▼          ▼
 web:8080   api:3000   bancho:10000   mysql    redis
                           │            ▲        ▲
                           └── bot ─────┘────────┘
```

- **`internal`**: rede de todos os serviços. Não usa `internal: true` de propósito —
  API, bot e bancho precisam de saída para a internet (osu! API, Discord, Groq,
  mirrors de mapas) e o Caddy precisa do Let's Encrypt. O isolamento vem de **não
  publicar portas**, não de bloquear a saída.
- **`public_proxy`**: rede externa, criada fora deste repositório, onde vivem dois
  projetos de terceiros servidos pelo mesmo Caddy (`tickets.fubika.com.br` e
  `app.fubika.com.br`). O Caddy só entra nela **em produção**
  (`docker-compose.prod.yml`), e os blocos ficam em
  `infra/caddy/extras-prod/terceiros.caddyfile`, intocados. Serão removidos no futuro.

### Quem publica porta

| Ambiente  | Portas no host                                                        |
| --------- | --------------------------------------------------------------------- |
| produção  | **só o caddy**: `80`, `443`, `443/udp`                                |
| staging   | caddy (`80`, `443`, `443/udp`) + mysql `127.0.0.1:3306` e redis `127.0.0.1:6379` (só loopback, para o túnel SSH) |
| dev       | tudo, mas sempre em `127.0.0.1`                                       |

Confira a qualquer momento com `make env-check`.

### Domínios (derivados de `DOMAIN`)

| Host                | Vai para          |
| ------------------- | ----------------- |
| `DOMAIN`, `www.`    | `web:8080`        |
| `api.`              | `api:3000`        |
| `c. ce. c4. osu. b.`| `bancho:10000`    |
| `a.`                | arquivos de `volumes/avatars` |
| `assets.`           | arquivos de `volumes/assets`  |

---

## 2. Variáveis de ambiente

**Existe um único arquivo de variáveis por máquina: o `.env` na raiz do repositório.**
O modelo versionado é o `.env.example`. Não existe `.env` em `services/*` nem em `infra/`.

Os arquivos compose ficam na raiz justamente por isso: o "project directory" do
Compose passa a ser a raiz, onde está o `.env`, e nenhum comando precisa de
`--env-file` ou `-f`.

Cada serviço recebe **só as variáveis que usa**, via `environment:` explícito no
compose. A única exceção é o `bancho`, que lê dezenas de configs de jogo e por isso
recebe o `.env` inteiro via `env_file:` (ou seja: o container do bancho vê todos os
segredos do arquivo — se isso incomodar no futuro, o caminho é dividir em
`infra/env/bancho.env`).

Valores internos do Docker **não ficam no `.env`** — são fixos no compose:
`APP_HOST=0.0.0.0`, `APP_PORT=10000`, `API_PORT=3000`, `DB_HOST=mysql`,
`DB_PORT=3306`, `REDIS_HOST=redis`, `REDIS_PORT=6379`, `REDIS_USER=default`,
`REDIS_DB=0`, `WEB_PORT=8080`. `DATABASE_URL`, `SHADOW_DATABASE_URL` e `REDIS_URL`
são montadas pelo compose a partir de `DB_*` e `REDIS_PASS`.

### Cuidados com a sintaxe

- Valores com espaço precisam de aspas duplas (`TLS_OPTS="tls internal"`): o Compose
  remove as aspas, e os scripts de dev também.
- `#` no meio de um valor sem aspas começa comentário.
- `$` em senha precisa ser escrito `$$`.
- `DB_PASS` e `REDIS_PASS` entram em URLs (`mysql://…`, `redis://…`): use só letras e
  números. `make env-check` reclama se houver `@ : / ? # % $` ou espaço.

---

## 3. Ambientes

| Ambiente   | Onde                     | Domínio                 | `COMPOSE_FILE`                                 | Deploy |
| ---------- | ------------------------ | ----------------------- | ---------------------------------------------- | ------ |
| dev        | máquina do dev           | `localhost`             | `docker-compose.yml:docker-compose.dev.yml`     | `make dev` |
| staging    | AWS Lightsail (2 GB)     | `staging.fubika.com.br` | `docker-compose.yml:docker-compose.staging.yml` | merge de PR em `develop` |
| produção   | VM da Azure              | `fubika.com.br`         | `docker-compose.yml:docker-compose.prod.yml`    | merge de `develop` em `main` |

Cada servidor escolhe os arquivos pelo `COMPOSE_FILE` do seu `.env` — por isso um
`docker compose up -d` sem flag nenhuma funciona lá. Junto dele vai
`COMPOSE_PATH_SEPARATOR=:`, que é o padrão do Linux mas **não** do Docker Desktop
no Windows/WSL (lá o padrão é `;`, e sem isso o `COMPOSE_FILE` é lido como um nome
de arquivo só).

Requisito: Docker Compose **≥ 2.24** (o `docker-compose.dev.yml` usa a tag
`!override` nas portas do Caddy).

---

## 4. Deploy

Nenhum deploy é feito à mão. O fluxo é:

```
feature ──PR──► develop ──(push)──► build das 5 imagens ──► :<sha> + :staging ──► staging
                   │
                   └──PR──► main ──(push)──► promove :staging ──► :prod + :prod-<sha> ──► produção
```

- **`.github/workflows/ci.yml`** roda em todo PR para `develop` e `main`: jobs `api`,
  `bot`, `web` e `docker` (que builda as 5 imagens sem publicar).
- **`.github/workflows/deploy-staging.yml`** (push em `develop`): builda e publica as
  5 imagens no GHCR com as tags `<sha>` e `staging`, copia os arquivos de infra para
  o servidor, grava `TAG=<sha>` no `.env` dele, e roda `pull` + `up -d`.
- **`.github/workflows/deploy-production.yml`** (push em `main`): **não builda nada.**
  Promove a imagem que já está rodando em staging com
  `docker buildx imagetools create`, retaggeando `:staging` para `:prod` e
  `:prod-<sha>`, e faz o mesmo deploy por SSH no environment `production`
  (com aprovação manual).

A mesma imagem vai do staging para a produção. Para isso o front **não** pode ter a
URL da API embutida no build: `services/web/src/config.ts` deriva tudo de
`window.location.hostname` em runtime.

Os dois workflows usam os mesmos nomes de secrets/variables, definidos por GitHub
Environment: secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_PORT` (opcional) e a
variable `DEPLOY_PATH`.

### Rollback

```bash
# Opção 1 (preferida): Actions -> deploy-production -> Run workflow
#   input tag = prod-<sha antigo>
#
# Opção 2 (na mão, no servidor):
cd "$DEPLOY_PATH"
sed -i 's/^TAG=.*/TAG=prod-<sha antigo>/' .env
docker compose pull && docker compose up -d
```

Para saber quais tags existem: aba **Packages** do GitHub, ou
`docker buildx imagetools inspect ghcr.io/henrique117/fubika-api:prod`.

---

## 5. Backup e restauração

O serviço `backup` (imagem baseada em `mysql:8.0`) roda um loop simples: espera até
`BACKUP_HOUR` (padrão `04`, no fuso `TZ`), gera
`backups/fubika_AAAA-MM-DD_HHMM.sql.gz` com
`--single-transaction --quick --no-tablespaces --routines`, e apaga os dumps com mais
de `RETENTION_DAYS` dias (padrão 7). A senha nunca vai na linha de comando: ele usa
um arquivo temporário e `--defaults-extra-file`.

```bash
make backup-now          # gera um backup agora (funciona em dev e no servidor)
ls -lh backups/          # ver o que existe
```

Restaurar:

```bash
# 1. pare o que escreve no banco
docker compose stop bancho api bot

# 2. restaure (ATENÇÃO: sobrescreve os dados atuais)
zcat backups/fubika_2026-11-20_0400.sql.gz | \
  docker compose exec -T -e MYSQL_PWD="$DB_ROOT_PASS" mysql \
  mysql -u root fubika

# 3. suba de novo
docker compose up -d
```

O backup **não é mais feito pela API**. O cron da API continua existindo, mas só com
o snapshot de ranking e a limpeza de histórico.

---

## 6. Migrations

As migrations vivem em `services/api/prisma/migrations/` e são aplicadas pelo
`services/api/scripts/start.sh` (`prisma migrate deploy`) a cada boot da API —
nunca mais `db push --accept-data-loss`.

```bash
make migrate-new name=adiciona_campo_x   # cria a migration (sempre contra o banco LOCAL)
make migrate-status                      # estado local
make migrate-status alvo=tunnel          # estado do staging (precisa do túnel)
make migrate-deploy alvo=tunnel          # aplica no staging
```

`migrate dev` é bloqueado contra o staging pelo próprio script — ele poderia resetar
o banco.

---

## 7. Acesso ao staging (túnel SSH)

No staging, MySQL e Redis são publicados **apenas em `127.0.0.1`**. Para alcançá-los:

```bash
make tunnel-staging    # deixe esse terminal aberto
#   127.0.0.1:3307 -> MySQL do staging
#   127.0.0.1:6380 -> Redis do staging

make api               # em outro terminal: API local usando os dados do staging
```

Host e usuário vêm de `STAGING_SSH_HOST` e `STAGING_SSH_USER` no `.env`.

---

## 8. Estrutura dos arquivos

```
docker-compose.yml           base (staging + produção)
docker-compose.prod.yml      + rede public_proxy e blocos de terceiros no Caddy
docker-compose.staging.yml   + mysql/redis em 127.0.0.1 (para o túnel)
docker-compose.dev.yml       stack local buildando o código, portas em 127.0.0.1
Makefile                     atalhos (make help)
.env.example                 modelo do único .env
infra/
  caddy/Caddyfile            proxy e TLS de todos os ambientes
  caddy/extras/              blocos extras (vazio fora de produção)
  caddy/extras-prod/         tickets.fubika.com.br e app.fubika.com.br
  mysql/my.cnf               default_authentication_plugin (driver do bancho)
  mysql/init/01_shadow_db.sh shadow DB do Prisma, no primeiro boot
  backup/                    imagem e script do backup diário
  scripts/                   scripts usados pelo Makefile
```

---

## 9. Diagnóstico rápido

```bash
make env-check                 # .env + compose + quem publica porta
make ps                        # containers
make logs svc=api tail=100     # logs de um serviço
make shell-mysql               # cliente MySQL no container
docker compose exec api wget -qO- http://127.0.0.1:3000/ping   # saúde da API
```

Coisas que já morderam antes:

- **bancho não sobe em banco novo**: ele lê a tabela `startups` no boot, que é criada
  pela migration do Prisma. Em um banco vazio, suba a API primeiro (ela roda
  `migrate deploy`); o `restart: unless-stopped` do bancho resolve sozinho depois.
- **permissão nos volumes**: todos os serviços rodam como uid 1000. Diretórios criados
  pelo Docker nascem como `root`, e aí o bancho quebra no boot ao criar
  `.data/ss` ou `.data/assets/medals/client`. Use `make dirs` em dev, ou
  `sudo chown -R 1000:1000 volumes backups` no servidor.
- **primeiro boot do bancho é lento**: ele baixa ~344 imagens de medalhas de
  `assets.ppy.sh`, de forma síncrona.
- **`init/01_shadow_db.sh` só roda em datadir vazio**: num banco que já existe, crie o
  shadow DB à mão se precisar.
