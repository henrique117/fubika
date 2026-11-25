#!/usr/bin/env bash
# ==============================================================================
# Funções compartilhadas pelos scripts de desenvolvimento.
#
# Uso: no começo do script,
#   ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
#   . "$ROOT/infra/scripts/lib.sh"
# ==============================================================================

ENV_FILE="${ENV_FILE:-$ROOT/.env}"

erro() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; }
aviso() { printf '\033[33m! %s\033[0m\n' "$*" >&2; }
info() { printf '\033[36m→ %s\033[0m\n' "$*"; }
ok() { printf '\033[32m✓ %s\033[0m\n' "$*"; }

exigir_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        erro "não encontrei o .env na raiz do repositório."
        erro "esperado em: $ENV_FILE"
        info "crie com:  cp .env.example .env   (e preencha os valores)"
        exit 1
    fi
}

# env_get CHAVE [PADRÃO]
# Lê uma variável do .env SEM sourcear o arquivo: valores com espaço, '#' ou
# aspas não quebram nada e nenhum comando do arquivo é executado.
env_get() {
    local chave="$1" padrao="${2:-}" valor
    valor="$(sed -n "s/^[[:space:]]*${chave}=//p" "$ENV_FILE" | tail -n 1)"
    # remove aspas em volta (o Compose também as remove)
    if [[ "$valor" =~ ^\"(.*)\"$ ]] || [[ "$valor" =~ ^\'(.*)\'$ ]]; then
        valor="${BASH_REMATCH[1]}"
    else
        # sem aspas: corta comentário no fim e espaços sobrando
        valor="${valor%%[[:space:]]#*}"
        valor="${valor%"${valor##*[![:space:]]}"}"
    fi
    if [ -n "$valor" ]; then printf '%s' "$valor"; else printf '%s' "$padrao"; fi
}

# exigir_env CHAVE "explicação"
exigir_env() {
    local valor
    valor="$(env_get "$1")"
    if [ -z "$valor" ]; then
        erro "$1 não está definida no .env da raiz."
        [ -n "${2:-}" ] && info "$2"
        exit 1
    fi
    printf '%s' "$valor"
}

# porta_aberta PORTA [HOST] — checa TCP sem depender de nc/netcat.
porta_aberta() {
    local porta="$1" host="${2:-127.0.0.1}"
    (exec 3<>"/dev/tcp/${host}/${porta}") >/dev/null 2>&1
}

# porta_de_url URL — extrai a porta de uma URL (mysql://..:3307/..).
porta_de_url() {
    printf '%s' "$1" | sed -n 's#.*:\([0-9]\{1,5\}\)/.*#\1#p'
}

# Garante que as dependências de Node existem no serviço informado.
garantir_node_modules() {
    local dir="$1"
    if [ ! -d "$dir/node_modules" ]; then
        info "instalando dependências em ${dir#"$ROOT"/}..."
        (cd "$dir" && npm ci)
    fi
}
