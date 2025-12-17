# Mudamos de 'alpine' para 'slim' (Debian). 
# Isso resolve 99% dos problemas de compatibilidade do Prisma.
FROM node:20-slim

WORKDIR /app

# Instala o OpenSSL e dependências básicas no Debian
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates procps && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Gera o cliente Prisma (agora vai baixar o binário certo para Debian)
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]