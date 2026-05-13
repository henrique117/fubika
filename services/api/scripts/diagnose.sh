#!/bin/sh
set -e

echo "🔍 Diagnóstico do Prisma..."

# Verificar se o Prisma está instalado
echo "📦 Verificando instalação do Prisma..."
npm list prisma @prisma/client

# Verificar se os engines existem
echo "⚙️  Verificando engines do Prisma..."
ls -la node_modules/@prisma/engines/ 2>/dev/null || echo "Engines não encontrados"

# Verificar se o cliente foi gerado
echo "🔧 Verificando cliente Prisma..."
ls -la node_modules/.prisma/ 2>/dev/null || echo "Cliente não gerado"

# Tentar gerar novamente
echo "🔄 Gerando cliente Prisma..."
npx prisma generate --schema=./prisma/schema.prisma

# Testar conexão
echo "🧪 Testando conexão com banco..."
npx prisma db push --preview-feature || echo "Erro na conexão"

echo "✅ Diagnóstico concluído"