#!/bin/bash
# ==============================================================================
# Roda UMA ÚNICA VEZ, na primeira inicialização de um datadir vazio.
#
# O entrypoint oficial do MySQL já cria o banco (MYSQL_DATABASE), o usuário
# (MYSQL_USER/MYSQL_PASSWORD) e dá GRANT ALL dele no banco principal — nada
# disso precisa ser repetido aqui.
#
# A única coisa que falta é o "shadow database" do Prisma Migrate, usado por
# `prisma migrate dev`/`migrate diff` para validar migrations sem tocar no banco
# real (sem ele, o Prisma falha com P3014).
#
# A senha do root NÃO vai na linha de comando (ficaria visível em `ps`):
# ela é escrita num arquivo temporário 0600 lido via --defaults-extra-file.
# ==============================================================================
set -euo pipefail

: "${MYSQL_DATABASE:?MYSQL_DATABASE não definido}"
: "${MYSQL_USER:?MYSQL_USER não definido}"
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD não definido}"

CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT
printf '[client]\nuser=root\npassword=%s\nprotocol=socket\n' "$MYSQL_ROOT_PASSWORD" >"$CNF"

echo "[init] criando shadow database ${MYSQL_DATABASE}_shadow para o Prisma..."

mysql --defaults-extra-file="$CNF" <<SQL
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}_shadow\`;
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}_shadow\`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "[init] ok: ${MYSQL_DATABASE}_shadow"
