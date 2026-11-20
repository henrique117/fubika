#!/usr/bin/env bash
# ==============================================================================
# Fubika — deploy por SSH (lado do RUNNER)
# ==============================================================================
#
# Copia os arquivos de infra para o servidor e executa .github/scripts/
# remote-deploy.sh lá dentro. É o MESMO script para staging e produção: a única
# diferença entre os dois ambientes são as variáveis de entrada, que vêm dos
# secrets/variables do GitHub Environment correspondente.
#
# Por que este script existe em vez de uma action de terceiro para SSH:
#   - uma action de SSH recebe a chave privada e o host de produção; fixar o SHA
#     dela reduz, mas não elimina, a superfície de confiança. ssh/rsync já vêm
#     instalados no runner do GitHub, então a dependência extra não compra nada.
#   - as actions populares de SSH usam `StrictHostKeyChecking=no` por padrão, o
#     que aceita qualquer chave de host (MITM). Aqui o known_hosts é montado com
#     ssh-keyscan e o StrictHostKeyChecking fica em `yes`.
#   - script versionado = o mesmo código roda nos dois ambientes e dá para
#     revisar/rodar shellcheck nele.
#
# Entradas (variáveis de ambiente):
#   SSH_HOST      host do servidor                               (secret)
#   SSH_USER      usuário SSH                                    (secret)
#   SSH_KEY       chave privada OpenSSH, conteúdo inteiro         (secret)
#   SSH_PORT      porta SSH                        (opcional, padrão 22)
#   DEPLOY_PATH   diretório da stack no servidor                  (variable)
#   TAG           tag das imagens a subir (ex.: <sha> ou prod-<sha>)
#   GHCR_USER     usuário para o docker login no GHCR
#   GHCR_TOKEN    token para o docker login no GHCR
# ==============================================================================
set -euo pipefail

: "${SSH_HOST:?SSH_HOST não definido (secret do Environment)}"
: "${SSH_USER:?SSH_USER não definido (secret do Environment)}"
: "${SSH_KEY:?SSH_KEY não definido (secret do Environment)}"
: "${DEPLOY_PATH:?DEPLOY_PATH não definido (variable do Environment)}"
: "${TAG:?TAG não definido}"
: "${GHCR_USER:?GHCR_USER não definido}"
: "${GHCR_TOKEN:?GHCR_TOKEN não definido}"
SSH_PORT="${SSH_PORT:-22}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Arquivos da raiz que vão para o servidor. services/ e .git NÃO vão: o servidor
# só roda imagens prontas do GHCR, não builda nada.
ROOT_FILES=(
  docker-compose.yml
  docker-compose.staging.yml
  docker-compose.prod.yml
  Makefile
)

# ------------------------------------------------------------------ 1. chave ---
# Caminho FIXO (e não mktemp) para que o passo de limpeza `if: always()` do
# workflow saiba onde apagar mesmo se este script morrer no meio.
SSH_DIR="${RUNNER_TEMP:-/tmp}/fubika-ssh"
KEY_FILE="$SSH_DIR/id_deploy"
KNOWN_HOSTS="$SSH_DIR/known_hosts"

rm -rf "$SSH_DIR"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# umask antes de escrever: o arquivo nasce 0600, nunca existe com modo frouxo.
umask 077
printf '%s\n' "$SSH_KEY" >"$KEY_FILE"
chmod 600 "$KEY_FILE"

# A chave de host vem do próprio servidor em vez de desligar a verificação.
echo "==> Coletando a chave de host de $SSH_HOST:$SSH_PORT"
ssh-keyscan -p "$SSH_PORT" -H "$SSH_HOST" >"$KNOWN_HOSTS" 2>/dev/null || true
# ssh-keyscan sai com 0 mesmo quando não encontra nada: o que vale é o arquivo.
if [ ! -s "$KNOWN_HOSTS" ]; then
  echo "::error::ssh-keyscan não obteve a chave de host de $SSH_HOST:$SSH_PORT" >&2
  exit 1
fi

SSH_OPTS=(
  -i "$KEY_FILE"
  -p "$SSH_PORT"
  -o "UserKnownHostsFile=$KNOWN_HOSTS"
  -o StrictHostKeyChecking=yes
  -o IdentitiesOnly=yes
  -o BatchMode=yes
  -o ConnectTimeout=20
)

# O `-e` do rsync recebe uma string e separa só por espaço (não entende aspas).
# Os caminhos aqui são do RUNNER_TEMP do runner, sem espaços.
RSYNC_SSH="ssh -i $KEY_FILE -p $SSH_PORT -o UserKnownHostsFile=$KNOWN_HOSTS"
RSYNC_SSH="$RSYNC_SSH -o StrictHostKeyChecking=yes -o IdentitiesOnly=yes -o BatchMode=yes"

# ----------------------------------------------------------- 2. pré-checagem ---
for f in "${ROOT_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "::error::$f não existe na raiz do repositório — nada a copiar" >&2
    exit 1
  fi
done
if [ ! -d infra ]; then
  echo "::error::a pasta infra/ não existe na raiz do repositório" >&2
  exit 1
fi

echo "==> Verificando o servidor"
# O $DEPLOY_PATH abaixo expande AQUI, no runner (é config do Environment,
# não entrada de usuário) — é exatamente o que se quer: o servidor recebe o
# caminho já resolvido.
# shellcheck disable=SC2029
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "
  set -eu
  command -v rsync  >/dev/null || { echo 'rsync não está instalado no servidor' >&2; exit 1; }
  command -v docker >/dev/null || { echo 'docker não está instalado no servidor' >&2; exit 1; }
  mkdir -p '$DEPLOY_PATH'
  # O .env do servidor é mantido à mão e guarda os segredos: o deploy só o
  # edita, nunca o cria — se não existe, é erro de provisionamento.
  test -f '$DEPLOY_PATH/.env' || { echo 'não existe .env em $DEPLOY_PATH' >&2; exit 1; }
"

# --------------------------------------------------------------- 3. arquivos ---
# -rlptz em vez de -a: -a arrastaria -o/-g/-D (dono, grupo, devices), que exigem
# root no destino e não têm sentido vindo de um runner efêmero.
echo "==> Copiando os arquivos compose e o Makefile"
rsync -rlptz --no-perms --chmod=F644 -e "$RSYNC_SSH" \
  "${ROOT_FILES[@]}" \
  "$SSH_USER@$SSH_HOST:$DEPLOY_PATH/"

# --delete SÓ aqui dentro, e com as duas barras finais, para que o escopo do
# apagamento seja exatamente $DEPLOY_PATH/infra/. O .env fica de fora por
# --exclude (arquivo excluído não é apagado pelo --delete) e volumes/ e backups/
# vivem na raiz do DEPLOY_PATH, fora deste caminho.
echo "==> Sincronizando infra/ (com --delete restrito a infra/)"
rsync -rlptz --delete --no-perms --chmod=F644,D755 \
  --exclude='.env' --exclude='.env.*' \
  -e "$RSYNC_SSH" \
  infra/ "$SSH_USER@$SSH_HOST:$DEPLOY_PATH/infra/"

# ----------------------------------------------------------------- 4. deploy ---
# O corpo do deploy remoto vai por STDIN do `bash -s`, com as variáveis (entre
# elas o token do GHCR) injetadas como linhas de atribuição antes do script.
# Assim nada secreto aparece em argv (visível por `ps` no servidor) nem é
# gravado em arquivo. `%q` é a citação do próprio bash, segura para qualquer
# valor.
echo "==> Executando o deploy em $SSH_USER@$SSH_HOST:$DEPLOY_PATH (TAG=$TAG)"
{
  printf '# variáveis injetadas por .github/scripts/deploy.sh\n'
  printf 'DEPLOY_PATH=%q\n' "$DEPLOY_PATH"
  printf 'TAG=%q\n' "$TAG"
  printf 'GHCR_USER=%q\n' "$GHCR_USER"
  printf 'GHCR_TOKEN=%q\n' "$GHCR_TOKEN"
  cat "$SCRIPT_DIR/remote-deploy.sh"
} | ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" 'bash -s'

echo "==> Deploy concluído (TAG=$TAG)"
