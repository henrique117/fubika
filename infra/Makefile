#!/usr/bin/env make

# --- Comandos Principais ---

# Constrói as imagens (API e Bancho) baseadas no docker-compose.yml
build:
	docker compose build

# Sobe tudo rebuildando as imagens (Garante que o código novo da API e Bancho entrem em vigor)
run:
	docker compose up --build

# Sobe tudo em background (modo detached)
run-bg:
	docker compose up -d --build

# Para tudo e remove os containers
stop:
	docker compose down

# Para tudo e LIMPA o banco de dados (Cuidado!)
clean:
	docker compose down -v

# --- Comandos do Prisma (Banco de Dados) ---

# Roda uma migração normal.
# Uso: make migrate
# Uso com nome: make migrate name=adicionando_campo_discord
migrate:
	docker compose exec api npx prisma migrate dev $(if $(name),--name $(name),)

# Reseta o banco de dados e roda o Seed (Fubas Bot) novamente
# Pergunta confirmação antes de apagar tudo.
migrate-reset:
	docker compose exec api npx prisma migrate reset

# Abre o Prisma Studio no navegador (http://localhost:5555) para ver os dados
studio:
	docker compose exec api npx prisma studio --port 5555 --browser none

# Gera o cliente Prisma (caso você mude o schema e precise atualizar a tipagem sem migrar)
generate:
	docker compose exec api npx prisma generate


run-cfd:
	docker compose -f docker-compose.cloudflared.yml up

run-cfd-bg:
	docker compose -f docker-compose.cloudflared.yml up -d

run-caddy:
	caddy run --envfile .env --config ext/Caddyfile

last?=1
logs:
	docker compose logs -f bancho mysql redis api --tail ${last}

shell-bancho:
	docker compose exec bancho /bin/bash

shell-api:
	docker compose exec api /bin/bash

restart-api:
	docker compose restart api

bump:
	cd osu-bancho-service && poetry version $(version)
