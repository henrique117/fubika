#!/usr/bin/env bash
# `make tunnel-staging` — túnel SSH para o MySQL e o Redis do staging.
#
#   127.0.0.1:3307 -> mysql do staging (3306)
#   127.0.0.1:6380 -> redis do staging (6379)
#
# No servidor de staging esses dois serviços são publicados APENAS em 127.0.0.1
# (docker-compose.staging.yml), então este túnel é o único caminho de fora.
# Deixe este terminal aberto enquanto usar `make api`.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/infra/scripts/lib.sh"

exigir_env_file

HOST="$(exigir_env STAGING_SSH_HOST "preencha STAGING_SSH_HOST no .env (IP estático do Lightsail).")"
USUARIO="$(env_get STAGING_SSH_USER deploy)"
PORTA_SSH="$(env_get STAGING_SSH_PORT 22)"

for p in 3307 6380; do
    if porta_aberta "$p"; then
        erro "a porta local $p já está em uso — provavelmente o túnel já está aberto."
        exit 1
    fi
done

info "abrindo túnel para ${USUARIO}@${HOST}:${PORTA_SSH}"
info "  127.0.0.1:3307 -> MySQL do staging"
info "  127.0.0.1:6380 -> Redis do staging"
info "Ctrl+C encerra. Em outro terminal:  make api"

exec ssh -N \
    -p "$PORTA_SSH" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    -L 3307:127.0.0.1:3306 \
    -L 6380:127.0.0.1:6379 \
    "${USUARIO}@${HOST}"
