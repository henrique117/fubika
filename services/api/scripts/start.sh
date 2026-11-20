#!/bin/sh
set -e

echo "[API] Aplicando migrations e iniciando o servidor..."

npx prisma migrate deploy

exec node dist/server.js
