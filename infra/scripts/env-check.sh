#!/usr/bin/env bash
# `make env-check` — confere o .env e os arquivos compose deste ambiente.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/infra/scripts/lib.sh"

exigir_env_file

TMP_CFG="$(mktemp)"
trap 'rm -f "$TMP_CFG"' EXIT

falhas=0

# 1. Variáveis que o compose exige (${VAR:?}).
for chave in DOMAIN ACME_EMAIL DB_NAME DB_USER DB_PASS DB_ROOT_PASS REDIS_PASS \
    JWT_SECRET DISCORD_TOKEN CLIENT_ID; do
    if [ -z "$(env_get "$chave")" ]; then
        erro "$chave está vazia (o compose não sobe sem ela)"
        falhas=$((falhas + 1))
    fi
done

# 2. Senhas que entram em URL não podem ter caracteres que quebram a URL.
for chave in DB_PASS REDIS_PASS; do
    valor="$(env_get "$chave")"
    if [ -n "$valor" ] && printf '%s' "$valor" | grep -q '[@:/?#%$ ]'; then
        erro "$chave tem caractere que quebra DATABASE_URL/REDIS_URL (@ : / ? # % \$ ou espaço)"
        falhas=$((falhas + 1))
    fi
done

# 3. Avisos de segurança: valores de exemplo esquecidos.
for chave in DB_PASS DB_ROOT_PASS REDIS_PASS JWT_SECRET; do
    case "$(env_get "$chave")" in
    troque_* | "" ) aviso "$chave ainda está com o valor de exemplo" ;;
    esac
done

# 4. Coerência entre COMPOSE_FILE e DOMAIN/TLS_OPTS.
COMPOSE_FILE_VAL="$(env_get COMPOSE_FILE)"
DOMAIN_VAL="$(env_get DOMAIN)"
TLS_VAL="$(env_get TLS_OPTS)"
info "COMPOSE_FILE = ${COMPOSE_FILE_VAL:-(não definido)}"
info "DOMAIN       = ${DOMAIN_VAL}"
case "$COMPOSE_FILE_VAL" in
*dev.yml*)
    [ "$DOMAIN_VAL" = "localhost" ] || aviso "ambiente dev com DOMAIN=$DOMAIN_VAL (esperado localhost)"
    [ -n "$TLS_VAL" ] || aviso "em dev o TLS_OPTS costuma ser \"tls internal\""
    ;;
*prod.yml* | *staging.yml*)
    [ -z "$TLS_VAL" ] || aviso "TLS_OPTS deveria estar VAZIO fora do dev (certificado real via ACME)"
    case "$DOMAIN_VAL" in
    localhost | "") erro "DOMAIN=$DOMAIN_VAL não serve para staging/produção"; falhas=$((falhas + 1)) ;;
    esac
    ;;
"") aviso "COMPOSE_FILE não definido: 'docker compose' sem -f vai usar só o docker-compose.yml" ;;
esac

if [ -z "$(env_get COMPOSE_PATH_SEPARATOR)" ]; then
    aviso "COMPOSE_PATH_SEPARATOR não está definido — obrigatório no Docker Desktop (Windows/WSL)"
fi

# 5. O Compose consegue montar a configuração?
cd "$ROOT"
if docker compose config >/dev/null 2>&1; then
    ok "docker compose config: válido"
    info "portas publicadas neste ambiente:"
    docker compose config --format json 2>/dev/null >"$TMP_CFG" &&
        python3 "$ROOT/infra/scripts/portas.py" "$TMP_CFG"
else
    erro "docker compose config falhou:"
    docker compose config 2>&1 | grep -v "^time=" | tail -5
    falhas=$((falhas + 1))
fi

echo
if [ "$falhas" -gt 0 ]; then
    erro "$falhas problema(s) encontrado(s)"
    exit 1
fi
ok "tudo certo"
