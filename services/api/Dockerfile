# ----------------------------------------------------------------- builder ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# openssl e ca-certificates são exigidos pelos engines do Prisma.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Dependências primeiro, para aproveitar o cache de camadas.
COPY package.json package-lock.json ./
RUN npm ci

# O client do Prisma precisa do schema antes de gerar.
COPY prisma ./prisma/
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . .
RUN npm run build

# O prune apaga o client gerado junto com as devDependencies,
# por isso o generate roda de novo logo depois.
RUN npm prune --omit=dev && \
    npx prisma generate --schema=./prisma/schema.prisma

# ----------------------------------------------------------------- runtime ---
FROM node:20-bookworm-slim

WORKDIR /app

# Default seguro: o compose sobrescreve com development no ambiente de dev.
ENV NODE_ENV=production

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# A API grava avatares em process.cwd()/.data/avatars; o compose monta
# ./volumes/avatars nesse caminho.
RUN mkdir -p /app/.data/avatars && chown -R 1000:1000 /app/.data

COPY --from=builder --chown=1000:1000 /app/node_modules ./node_modules
COPY --from=builder --chown=1000:1000 /app/dist ./dist
COPY --from=builder --chown=1000:1000 /app/prisma ./prisma
COPY --from=builder --chown=1000:1000 /app/package.json ./package.json
COPY --from=builder --chown=1000:1000 /app/scripts/start.sh /usr/local/bin/start.sh

# O usuário 'node' da imagem oficial é uid/gid 1000 — mesmo valor usado nos chown.
USER node

EXPOSE 3000

CMD ["sh", "/usr/local/bin/start.sh"]
