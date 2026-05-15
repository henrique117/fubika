#!/bin/sh
set -e

echo "⏳ Aguardando o MySQL estar pronto na porta 3306..."

while ! nc -z fubika_mysql 3306; do
  sleep 1
done

echo "✅ MySQL conectado!"

if [ -d "prisma/migrations" ] && find prisma/migrations -name "*.sql" | grep -q .; then
    echo "🛠️  Pasta de migrações encontrada. Usando 'migrate deploy'..."
    npx prisma migrate deploy
else
    echo "⚠️  Sem histórico de migrações. Sincronizando via 'db push'..."
    npx prisma db push --accept-data-loss --skip-generate
fi

# echo "🌱 Rodando Seeders..."
# npx prisma db seed

echo "🚀 Iniciando Servidor API..."
node dist/server.js
