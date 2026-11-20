#!/usr/bin/env bash
# Roda o CLI do Prisma com o DATABASE_URL certo, sem depender de .env dentro de
# services/api.
#
#   infra/scripts/prisma.sh --local  migrate dev --name x
#   infra/scripts/prisma.sh --tunnel migrate status
#
# --local  (padrão): MySQL local do `make deps-db`  (127.0.0.1:3306)
# --tunnel         : MySQL do staging pelo túnel    (LOCAL_DATABASE_URL)
#
# ATENÇÃO: `migrate dev` só deve ser usado com --local. Ele compara o banco com
# o schema, pode pedir reset e escreve arquivos de migration.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/infra/scripts/lib.sh"

exigir_env_file

ALVO="--local"
case "${1:-}" in
--local | --tunnel)
    ALVO="$1"
    shift
    ;;
esac

if [ "$#" -eq 0 ]; then
    erro "uso: $0 [--local|--tunnel] <comando do prisma...>"
    exit 1
fi

DB_NAME="$(env_get DB_NAME fubika)"

if [ "$ALVO" = "--tunnel" ]; then
    DB_URL="$(env_get LOCAL_DATABASE_URL)"
    [ -n "$DB_URL" ] || {
        erro "LOCAL_DATABASE_URL não está no .env"
        exit 1
    }
    PORTA="$(porta_de_url "$DB_URL")"
    porta_aberta "${PORTA:-3307}" || {
        erro "túnel fechado (127.0.0.1:${PORTA:-3307}). Rode: make tunnel-staging"
        exit 1
    }
    if [ "${1:-} ${2:-}" = "migrate dev" ]; then
        erro "não rode 'migrate dev' contra o staging — ele altera/reseta o banco."
        info "gere a migration local (make migrate-new) e aplique com migrate-deploy."
        exit 1
    fi
    aviso "alvo: STAGING (pelo túnel)"
else
    DB_URL="mysql://$(env_get DB_USER):$(env_get DB_PASS)@127.0.0.1:3306/${DB_NAME}"
    porta_aberta 3306 || {
        erro "nada em 127.0.0.1:3306. Rode: make deps-db"
        exit 1
    }
    info "alvo: MySQL local"
fi

export DATABASE_URL="$DB_URL"
export SHADOW_DATABASE_URL="${DB_URL}_shadow"

cd "$ROOT/services/api"
exec npx prisma "$@"
