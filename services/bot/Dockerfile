# ==============================================================================
# Fubika bot (Fubas) — build multi-estágio
# ==============================================================================
# A MESMA imagem vai de staging para produção: nada de URL de ambiente embutida
# aqui. Tudo chega em runtime pelo bloco `environment:` do compose da raiz.
#
# O registro dos slash commands NÃO acontece mais no build (ele falava com a API
# do Discord sem token durante o `docker build`): quem faz isso é o `npm start`,
# já com o container de pé e as variáveis definidas.
# ==============================================================================

# ----------------------------------------------------------------- builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# npm ci instala exatamente o que está no package-lock.json (que é versionado).
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# tsc emite o dist e o tsc-alias reescreve os imports '@/...' para caminhos
# relativos — sem ele o dist quebra com MODULE_NOT_FOUND.
RUN npm run build

# Deixa só as dependências de produção para o estágio final copiar.
RUN npm prune --omit=dev

# ----------------------------------------------------------------- runtime ---
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# A imagem node:20-alpine já traz o usuário 'node' com uid/gid 1000.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

# `npm start` = registra os comandos e só então sobe o bot (aborta se falhar).
CMD ["npm", "start"]
