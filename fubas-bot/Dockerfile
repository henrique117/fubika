# Usa uma imagem leve do Node 20
FROM node:20-alpine

# Cria a pasta do app dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (para aproveitar cache do Docker)
COPY package*.json ./

# Instala TODAS as dependências (inclusive devDependencies para poder rodar o tsc)
RUN npm install

# Copia o resto do código fonte
COPY . .

# Compila o TypeScript para JavaScript (cria a pasta dist/)
RUN npm run build

# Comando para iniciar o bot (roda direto o arquivo compilado para economizar memória)
CMD ["node", "dist/index.js"]