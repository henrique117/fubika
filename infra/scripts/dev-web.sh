#!/usr/bin/env bash
# `make web` — sobe só o front (Vite) na máquina do dev.
#
# Não precisa de Docker: o Vite serve o React e faz proxy de /api para
# https://api.<VITE_DEV_DOMAIN> (por padrão o staging). As variáveis vêm do
# .env da raiz via `envDir` do vite.config.ts.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/infra/scripts/lib.sh"

exigir_env_file

DOMINIO="$(env_get VITE_DEV_DOMAIN staging.fubika.com.br)"

info "front em http://localhost:5173"
info "/api  ->  https://api.${DOMINIO}"
garantir_node_modules "$ROOT/services/web"

cd "$ROOT/services/web"
exec npm run dev
