#!/usr/bin/env bash
# `make bot` — sobe o bot na máquina do dev, com o token de teste pessoal.
#
# - DISCORD_TOKEN / CLIENT_ID / DISCORD_GUILD_ID vêm do .env da raiz
#   (cada dev usa o SEU bot de teste; com DISCORD_GUILD_ID preenchido os
#   slash commands aparecem na hora, só naquela guild).
# - A API consultada é a do staging.
# - O Redis é o local (`make deps`), para o bot ouvir eventos de snipe.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/infra/scripts/lib.sh"

exigir_env_file

exigir_env DISCORD_TOKEN "crie um bot pessoal no Discord Developer Portal e cole o token." >/dev/null
exigir_env CLIENT_ID "é o Application ID do mesmo bot." >/dev/null

DOMINIO="$(env_get VITE_DEV_DOMAIN staging.fubika.com.br)"
GUILD="$(env_get DISCORD_GUILD_ID)"
REDIS="$(env_get LOCAL_REDIS_URL)"

if [ -z "$REDIS" ]; then
    erro "LOCAL_REDIS_URL não está definida no .env."
    info "exemplo: LOCAL_REDIS_URL=redis://default:SENHA@127.0.0.1:6379/0"
    exit 1
fi

PORTA_REDIS="$(porta_de_url "$REDIS")"
if ! porta_aberta "${PORTA_REDIS:-6379}"; then
    aviso "nada escutando em 127.0.0.1:${PORTA_REDIS:-6379} — o bot vai subir sem receber eventos."
    info "suba o Redis local com:  make deps"
fi

if [ -z "$GUILD" ]; then
    aviso "DISCORD_GUILD_ID vazio: os comandos serão registrados GLOBALMENTE (pode levar até 1h)."
    info "preencha DISCORD_GUILD_ID no .env para registro instantâneo na sua guild de teste."
fi

# Estas três sobrescrevem o .env de propósito: o `--env-file` do Node não
# sobrepõe variáveis que já existem no ambiente, então quem manda é o shell.
export API_URL="https://api.${DOMINIO}"
export REDIS_URL="$REDIS"
# Sem isso os links dos embeds apontariam para produção (padrão do código).
export PUBLIC_DOMAIN="$DOMINIO"
export NODE_ENV=development

info "API      -> $API_URL"
info "links    -> https://${DOMINIO}/beatmap/..."
info "Redis    -> 127.0.0.1:${PORTA_REDIS:-6379}"
garantir_node_modules "$ROOT/services/bot"

cd "$ROOT/services/bot"
exec npm run dev
