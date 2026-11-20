#!/usr/bin/env bash
# ==============================================================================
# Fubika — deploy (lado do SERVIDOR)
# ==============================================================================
#
# Este script NÃO é copiado para o servidor: ele é enviado pelo STDIN de um
# `bash -s` por .github/scripts/deploy.sh, que injeta estas variáveis como
# linhas de atribuição logo antes do corpo abaixo:
#
#   DEPLOY_PATH   diretório da stack no servidor
#   TAG           tag das imagens a subir
#   GHCR_USER     usuário do docker login
#   GHCR_TOKEN    token do docker login
#
# Não há `docker compose -f ...` em lugar nenhum de propósito: o .env do
# servidor define COMPOSE_FILE e COMPOSE_PATH_SEPARATOR, então basta rodar
# `docker compose` a partir do DEPLOY_PATH para pegar os arquivos certos
# (base + override do ambiente).
# ==============================================================================

# shellcheck disable=SC2154  # DEPLOY_PATH/TAG/GHCR_* são injetadas pelo deploy.sh
set -euo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH não injetado}"
: "${TAG:?TAG não injetado}"
: "${GHCR_USER:?GHCR_USER não injetado}"
: "${GHCR_TOKEN:?GHCR_TOKEN não injetado}"

# A TAG entra num `sed` e numa linha do .env: só aceita o alfabeto de tags de
# imagem do Docker, nada de barra, aspas, `$` ou nova linha.
case "$TAG" in
  '' | *[!A-Za-z0-9._-]*)
    echo "TAG inválida para uma tag de imagem Docker: '$TAG'" >&2
    exit 1
    ;;
esac

cd "$DEPLOY_PATH"

# Sai do GHCR em qualquer desfecho (sucesso, erro ou sinal): o credential store
# do servidor não deve guardar o token do runner depois do deploy.
limpar() {
  docker logout ghcr.io >/dev/null 2>&1 || true
}
trap limpar EXIT

# ------------------------------------------------------- 1. TAG no .env ---
# O .env do servidor é a fonte dos segredos e é mantido à mão: aqui só a linha
# TAG= é tocada, de forma idempotente (substitui se existe, acrescenta se não).
echo "==> Gravando TAG=$TAG no .env"
umask 077
env_tmp="$(mktemp "$DEPLOY_PATH/.env.deploy.XXXXXX")"
# shellcheck disable=SC2064  # expandir $env_tmp agora é o comportamento desejado
trap "rm -f '$env_tmp'; limpar" EXIT

if grep -qE '^[[:space:]]*TAG=' .env; then
  sed -E "s|^[[:space:]]*TAG=.*|TAG=$TAG|" .env >"$env_tmp"
else
  {
    cat .env
    printf '\n# Tag das imagens em uso neste ambiente (gravada pelo deploy do CI).\n'
    printf 'TAG=%s\n' "$TAG"
  } >"$env_tmp"
fi

# Rede de segurança antes de sobrescrever um arquivo com segredos.
if [ ! -s "$env_tmp" ] || ! grep -qE "^TAG=$TAG\$" "$env_tmp"; then
  echo "a reescrita do .env saiu errada; o .env original foi preservado" >&2
  exit 1
fi

# `cat >` e não `mv`: preserva inode, dono e permissões do .env original.
cat "$env_tmp" >.env
rm -f "$env_tmp"

# ------------------------------------------------------------ 2. imagens ---
echo "==> Login no GHCR"
# printf é builtin: o token não passa por argv de processo nenhum.
printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

echo "==> docker compose pull"
docker compose pull

echo "==> docker compose up -d --remove-orphans"
docker compose up -d --remove-orphans

echo "==> Limpando imagens órfãs"
docker image prune -f

# ------------------------------------------------------------- 3. saúde ---
echo "==> Estado dos serviços"
docker compose ps

# O /ping da API faz um SELECT 1 no MySQL, então um ping OK prova de uma vez
# que a API subiu e que ela alcança o banco. `node -e` porque a imagem é
# node:20-slim e não tem curl nem wget; o fetch global existe desde o Node 18.
echo "==> Aguardando a API responder /ping"
ping_ok=0
for _ in $(seq 1 30); do
  if docker compose exec -T api \
    node -e "fetch('http://127.0.0.1:3000/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    >/dev/null 2>&1; then
    ping_ok=1
    break
  fi
  sleep 5
done

if [ "$ping_ok" -ne 1 ]; then
  echo "a API não respondeu /ping em ~150s — últimas linhas do log:" >&2
  docker compose logs --tail 60 api >&2 || true
  exit 1
fi
echo "    API respondeu /ping"

# Containers mortos depois da subida. `restarting` fica de fora da checagem de
# propósito: com `restart: unless-stopped` um container recém-criado pode passar
# por esse estado por alguns segundos sem que nada esteja errado.
paradas="$(docker compose ps -a --status exited --status dead --quiet)"
if [ -n "$paradas" ]; then
  echo "há containers parados depois do deploy:" >&2
  docker compose ps -a >&2
  exit 1
fi

echo "==> Stack saudável com TAG=$TAG"
