FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    procps \
    netcat-openbsd \
    default-mysql-client && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

COPY scripts/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

RUN mkdir -p ../backups:/app/backups

EXPOSE 3000

CMD ["/usr/local/bin/start.sh"]
