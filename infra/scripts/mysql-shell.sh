#!/usr/bin/env bash
# `make shell-mysql` — abre o cliente MySQL dentro do container do banco.
#
# A senha vai por MYSQL_PWD (variável de ambiente) e não na linha de comando,
# para não aparecer em `ps` dentro do container.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/infra/scripts/lib.sh"

exigir_env_file

DB_NAME="$(env_get DB_NAME fubika)"
DB_USER="$(env_get DB_USER fubika)"
DB_PASS="$(exigir_env DB_PASS)"

cd "$ROOT"
exec docker compose exec -e MYSQL_PWD="$DB_PASS" mysql \
    mysql -u "$DB_USER" -D "$DB_NAME"
