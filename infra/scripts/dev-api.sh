#!/usr/bin/env bash
# `make api`       (--tunnel) — API local contra o banco e o Redis do STAGING,
#                               através do túnel SSH (`make tunnel-staging`).
# `make api-local` (--local)  — API local contra o MySQL/Redis locais (`make deps-db`).
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/infra/scripts/lib.sh"

exigir_env_file

MODO="${1:---tunnel}"

case "$MODO" in
--tunnel)
    DB_URL="$(env_get LOCAL_DATABASE_URL)"
    RD_URL="$(env_get LOCAL_REDIS_URL)"
    if [ -z "$DB_URL" ] || [ -z "$RD_URL" ]; then
        erro "LOCAL_DATABASE_URL e/ou LOCAL_REDIS_URL não estão no .env."
        info "no modo túnel elas apontam para 127.0.0.1:3307 (MySQL) e 127.0.0.1:6380 (Redis)."
        exit 1
    fi
    PORTA_DB="$(porta_de_url "$DB_URL")"
    PORTA_RD="$(porta_de_url "$RD_URL")"
    if ! porta_aberta "${PORTA_DB:-3307}"; then
        erro "o túnel do staging não está aberto (nada em 127.0.0.1:${PORTA_DB:-3307})."
        info "abra em outro terminal:  make tunnel-staging"
        exit 1
    fi
    if ! porta_aberta "${PORTA_RD:-6380}"; then
        aviso "MySQL do túnel respondeu, mas o Redis (127.0.0.1:${PORTA_RD:-6380}) não."
        info 'confira se o make tunnel-staging está com os dois redirecionamentos.'
    fi
    ok "usando banco e Redis do STAGING pelo túnel (cuidado: dados reais)"
    ;;
--local)
    DB_URL="mysql://$(env_get DB_USER):$(env_get DB_PASS)@127.0.0.1:3306/$(env_get DB_NAME)"
    RD_URL="redis://default:$(env_get REDIS_PASS)@127.0.0.1:6379/0"
    if ! porta_aberta 3306; then
        erro "nada escutando em 127.0.0.1:3306."
        info "suba o MySQL local com:  make deps-db"
        exit 1
    fi
    if ! porta_aberta 6379; then
        aviso "Redis local (6379) fora do ar — suba com:  make deps"
    fi
    ok "usando MySQL e Redis LOCAIS"
    ;;
*)
    erro "modo inválido: $MODO (use --tunnel ou --local)"
    exit 1
    ;;
esac

# O `--env-file` do Node não sobrescreve o que já está no ambiente, então estas
# vencem as do .env (que, aliás, nem define DATABASE_URL/REDIS_URL).
export DATABASE_URL="$DB_URL"
# O banco de sombra é "<nome>_shadow", criado por infra/mysql/init/01_shadow_db.sh.
export SHADOW_DATABASE_URL="${DB_URL}_shadow"
export REDIS_URL="$RD_URL"
export NODE_ENV=development

garantir_node_modules "$ROOT/services/api"

cd "$ROOT/services/api"
if [ ! -d node_modules/.prisma/client ]; then
    info "gerando o Prisma Client..."
    npx prisma generate
fi

exec npm run dev
