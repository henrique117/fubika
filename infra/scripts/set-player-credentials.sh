#!/usr/bin/env bash
# Troca o nome e/ou a senha de um jogador direto no MySQL, pelo ID.
# A senha é gravada com o mesmo hash usado no código: bcrypt(md5_hex(senha)).
#
# Uso:
#   ./scripts/set-player-credentials.sh <id> "<novo nome>" "<nova senha>"
#   ./scripts/set-player-credentials.sh <id> "<novo nome>"            # só o nome
#   ./scripts/set-player-credentials.sh <id> "" "<nova senha>"        # só a senha

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

USER_ID="${1:-}"
NEW_NAME="${2:-}"
NEW_PASS="${3:-}"

if [[ -z "$USER_ID" || ! "$USER_ID" =~ ^[0-9]+$ ]]; then
    echo "❌ Informe o ID numérico do jogador." >&2
    echo "   Uso: $0 <id> \"<novo nome>\" \"<nova senha>\"" >&2
    exit 1
fi

if [[ -z "$NEW_NAME" && -z "$NEW_PASS" ]]; then
    echo "❌ Informe pelo menos um novo nome ou uma nova senha." >&2
    exit 1
fi

if [[ ! -f .env ]]; then
    echo "❌ infra/.env não encontrado." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

: "${DB_ROOT_PASS:?DB_ROOT_PASS ausente no .env}"
: "${DB_NAME:?DB_NAME ausente no .env}"

running() {
    docker compose ps --status running --services 2>/dev/null | grep -qx "$1"
}

mysql_exec() {
    docker compose exec -T -e MYSQL_PWD="$DB_ROOT_PASS" mysql \
        mysql -u root -D "$DB_NAME" --batch --skip-column-names "$@"
}

# bcrypt(md5_hex(senha)) — mesmo esquema de services/api/src/utils/hash.ts
# e de services/bancho/app/api/domains/osu.py (registro de conta).
hash_password() {
    local pw="$1"

    if running bancho; then
        printf '%s' "$pw" | docker compose exec -T bancho python -c '
import sys, hashlib, bcrypt
pw = sys.stdin.buffer.read()
pw_md5 = hashlib.md5(pw).hexdigest().encode()
sys.stdout.write(bcrypt.hashpw(pw_md5, bcrypt.gensalt()).decode())
'
    elif running api; then
        printf '%s' "$pw" | docker compose exec -T api node -e '
const bcrypt = require("bcryptjs");
const { createHash } = require("crypto");
let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", async () => {
    const md5 = createHash("md5").update(data).digest("hex");
    process.stdout.write(await bcrypt.hash(md5, await bcrypt.genSalt()));
});
'
    else
        echo "❌ Suba o container 'bancho' ou 'api' para gerar o hash bcrypt." >&2
        exit 1
    fi
}

# Escapa aspas simples e barras invertidas para interpolar em string SQL.
sql_escape() {
    printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e "s/'/\\\\'/g"
}

if ! running mysql; then
    echo "❌ O container do MySQL não está rodando (docker compose up -d mysql)." >&2
    exit 1
fi

CURRENT_NAME="$(mysql_exec -e "SELECT name FROM users WHERE id = ${USER_ID};" || true)"
if [[ -z "$CURRENT_NAME" ]]; then
    echo "❌ Nenhum jogador com id=${USER_ID}." >&2
    exit 1
fi

SET_CLAUSES=()

if [[ -n "$NEW_NAME" ]]; then
    # safe_name segue app/utils.py::make_safe_name -> lower() + espaço vira "_"
    SAFE_NAME="$(printf '%s' "$NEW_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')"
    ESC_NAME="$(sql_escape "$NEW_NAME")"
    ESC_SAFE="$(sql_escape "$SAFE_NAME")"

    TAKEN="$(mysql_exec -e "SELECT id FROM users WHERE safe_name = '${ESC_SAFE}' AND id <> ${USER_ID};")"
    if [[ -n "$TAKEN" ]]; then
        echo "❌ O nome \"${NEW_NAME}\" já pertence ao usuário id=${TAKEN}." >&2
        exit 1
    fi

    SET_CLAUSES+=("name = '${ESC_NAME}'" "safe_name = '${ESC_SAFE}'")
fi

if [[ -n "$NEW_PASS" ]]; then
    echo "🔐 Gerando hash bcrypt(md5(senha))..."
    PW_BCRYPT="$(hash_password "$NEW_PASS")"
    if [[ ${#PW_BCRYPT} -ne 60 ]]; then
        echo "❌ Hash gerado é inválido (esperado 60 caracteres, veio ${#PW_BCRYPT})." >&2
        exit 1
    fi
    SET_CLAUSES+=("pw_bcrypt = '$(sql_escape "$PW_BCRYPT")'")
fi

SET_SQL="$(IFS=,; echo "${SET_CLAUSES[*]}")"

mysql_exec -e "UPDATE users SET ${SET_SQL} WHERE id = ${USER_ID};"

echo "✅ Jogador id=${USER_ID} atualizado (antes: \"${CURRENT_NAME}\")."
mysql_exec -e "SELECT id, name, safe_name, pw_bcrypt FROM users WHERE id = ${USER_ID};" |
    awk -F'\t' '{ printf "   id=%s | name=\"%s\" | safe_name=%s | pw_bcrypt=%s...\n", $1, $2, $3, substr($4, 1, 12) }'

if [[ -n "$NEW_PASS" ]] && running bancho; then
    echo "⚠️  Reinicie o bancho (make restart-bancho) ou peça pro jogador relogar:"
    echo "    o servidor mantém cache em memória do bcrypt e da sessão."
fi
