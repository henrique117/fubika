# ==============================================================================
# Fubika web — build do React (Vite) + nginx não-root
# ==============================================================================
# A MESMA imagem vai de staging para produção, então NÃO existe nenhum ARG/ENV
# de URL aqui: o front descobre os domínios em runtime a partir de
# window.location (ver src/config.ts).
# ==============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Só os manifests primeiro, para o 'npm ci' reaproveitar cache de camada
# enquanto package.json/package-lock.json não mudarem.
COPY package.json package-lock.json ./

# 'npm ci' (e não 'npm install') instala exatamente o que está no lockfile:
# build reprodutível e sem atualizar o lock dentro da imagem.
RUN npm ci

# O .dockerignore mantém node_modules do host, dist e qualquer .env fora daqui.
COPY . .

# 'tsc -b && vite build'. Não há variável de ambiente envolvida: o .env fica na
# raiz do repo, fora do contexto de build, e o padrão de src/config.ts cobre.
RUN npm run build

# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine

# nginx.conf COMPLETO: o conf padrão da imagem usa 'user nginx' e pid em
# /var/run, que não funcionam sem privilégio. O nosso não inclui conf.d/, então
# o default.conf da imagem (que escuta na porta 80) sai de cena.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# O que o nginx escreve: pid e temp paths em /tmp (ver nginx.conf, já
# escrevível por qualquer uid) e logs em stdout/stderr. Resta o /var/cache/nginx
# da imagem, que passa para o uid 1000 por segurança.
RUN chown -R 1000:1000 /var/cache/nginx

# uid numérico (a imagem não tem um usuário 'app'): o compose e o Caddy não
# dependem de nome de usuário nenhum.
USER 1000

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
