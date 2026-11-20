# ==============================================================================
# Fubika — atalhos de infra e de desenvolvimento
#
# Rode `make` (ou `make help`) para ver os comandos.
#
# Por que o Makefile e os compose ficam na RAIZ: assim o "project directory" do
# Docker Compose é a raiz do repo, onde vive o .env único — nenhum comando
# precisa de --env-file nem de -f. Os alvos de servidor usam `docker compose`
# puro, que resolve os arquivos pelo COMPOSE_FILE do .env daquela máquina.
# ==============================================================================

.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash

# Compose do ambiente (lê COMPOSE_FILE do .env da máquina).
DC := docker compose

# Compose da stack local, com os arquivos explícitos: `make dev` nunca depende
# do COMPOSE_FILE da máquina estar certo.
DC_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml

SCRIPTS := infra/scripts

.PHONY: help dirs env-check web bot api api-local deps deps-db fake-event \
        tunnel-staging dev dev-build down clean logs ps restart shell-api \
        shell-bancho shell-mysql up pull backup-now migrate-new migrate-status \
        migrate-deploy seed studio set-player build

# ------------------------------------------------------------------- ajuda ---

help: ## Mostra esta ajuda
	@echo ""
	@echo "  Fubika — comandos disponíveis"
	@echo ""
	@echo "  DESENVOLVIMENTO (um serviço por vez, na sua máquina)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## @dev ' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## @dev "};{printf "    \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  STACK LOCAL COMPLETA (Docker, inclui o bancho)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## @stack ' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## @stack "};{printf "    \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  BANCO DE DADOS"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## @db ' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## @db "};{printf "    \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  SERVIDOR (staging / produção)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## @srv ' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## @srv "};{printf "    \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  UTILITÁRIOS"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## [^@]' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## "};{printf "    \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""

# --------------------------------------------------- desenvolvimento local ---

web: ## @dev Sobe o front (Vite) com proxy para a API do staging
	@$(SCRIPTS)/dev-web.sh

bot: ## @dev Sobe o bot com o SEU token de teste e Redis local
	@$(SCRIPTS)/dev-bot.sh

api: ## @dev Sobe a API contra o banco/Redis do staging (precisa do túnel)
	@$(SCRIPTS)/dev-api.sh --tunnel

api-local: ## @dev Sobe a API contra o MySQL/Redis locais (make deps)
	@$(SCRIPTS)/dev-api.sh --local

deps: dirs ## @dev Sobe só o Redis local (para o bot ouvir eventos)
	@$(DC_DEV) up -d redis
	@echo "✓ Redis local em 127.0.0.1:6379"

deps-db: dirs ## @dev Sobe também o MySQL local
	@$(DC_DEV) up -d mysql
	@echo "✓ MySQL local em 127.0.0.1:3306"

fake-event: ## @dev Publica um evento falso de snipe/top1 (type=snipe|top1)
	@test -n "$(type)" || { echo "uso: make fake-event type=snipe [beatmap=70077] [player=3]"; exit 1; }
	@cd services/bot && npx tsx --env-file=../../.env scripts/fake-event.ts \
		--type=$(type) \
		$(if $(beatmap),--beatmap=$(beatmap),) \
		$(if $(player),--player=$(player),) \
		$(if $(discord),--discord=$(discord),)

tunnel-staging: ## @dev Abre o túnel SSH para o MySQL (3307) e Redis (6380) do staging
	@$(SCRIPTS)/tunnel-staging.sh

# ------------------------------------------------------------- stack local ---

dev: dirs ## @stack Sobe a stack completa local, buildando o código
	@$(DC_DEV) up -d --build
	@$(DC_DEV) ps

dev-build: ## @stack Só builda as imagens da stack local
	@$(DC_DEV) build

down: ## @stack Para e remove os containers
	@$(DC) down

clean: ## @stack Para tudo e APAGA os volumes nomeados (não mexe em ./volumes)
	@$(DC) down -v

restart: ## @stack Reinicia um serviço (svc=api)
	@test -n "$(svc)" || { echo "uso: make restart svc=api"; exit 1; }
	@$(DC) restart $(svc)

logs: ## @stack Acompanha logs (svc=api; vazio = todos)
	@$(DC) logs -f --tail=$(or $(tail),200) $(svc)

ps: ## @stack Lista os containers do projeto
	@$(DC) ps

shell-api: ## @stack Abre um shell no container da API
	@$(DC) exec api sh

shell-bancho: ## @stack Abre um shell no container do bancho
	@$(DC) exec bancho bash

shell-mysql: ## @stack Abre o cliente MySQL no container do banco
	@$(SCRIPTS)/mysql-shell.sh

# ----------------------------------------------------------------- banco -----

migrate-new: ## @db Cria uma migration a partir do schema (name=minha_mudanca)
	@test -n "$(name)" || { echo "uso: make migrate-new name=adiciona_campo_x"; exit 1; }
	@$(SCRIPTS)/prisma.sh --local migrate dev --name $(name)

migrate-status: ## @db Mostra o estado das migrations (alvo=local|tunnel)
	@$(SCRIPTS)/prisma.sh --$(or $(alvo),local) migrate status

migrate-deploy: ## @db Aplica as migrations pendentes (alvo=local|tunnel)
	@$(SCRIPTS)/prisma.sh --$(or $(alvo),local) migrate deploy

seed: ## @db Roda o seed do Prisma (alvo=local|tunnel)
	@$(SCRIPTS)/prisma.sh --$(or $(alvo),local) db seed

studio: ## @db Abre o Prisma Studio (alvo=local|tunnel)
	@$(SCRIPTS)/prisma.sh --$(or $(alvo),local) studio

# --------------------------------------------------------------- servidor ----

up: ## @srv Sobe a stack do ambiente desta máquina (usa o COMPOSE_FILE do .env)
	@$(DC) up -d --remove-orphans
	@$(DC) ps

pull: ## @srv Baixa as imagens da tag atual (TAG do .env)
	@$(DC) pull

build: ## @srv Builda as imagens localmente (último recurso; o normal é pull)
	@$(DC) build

backup-now: dirs ## @srv Gera um backup do banco agora, em ./backups
	@$(DC) --profile backup run --rm -e BACKUP_NOW=1 backup

# ------------------------------------------------------------- utilitários ---

set-player: ## Troca nome/senha de um jogador (id=3 name="X" pass="y")
	@$(SCRIPTS)/set-player-credentials.sh "$(id)" "$(name)" "$(pass)"

env-check: ## Valida o .env e os arquivos compose deste ambiente
	@$(SCRIPTS)/env-check.sh

dirs: ## Cria ./volumes e ./backups com o dono certo (uid 1000)
	@mkdir -p volumes/{mysql,redis,avatars,replays,maps,logs,assets,screenshots,caddy_data,caddy_config} backups
