# --- Estágio 1: Build (Compilação) ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código
COPY . .

# Argumentos de Build (Variáveis que o front precisa saber na hora de criar o HTML)
# Se o seu front usa Vite, é VITE_API_URL. Se usa React App, é REACT_APP_API_URL.
# Ajuste conforme o seu projeto.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Roda o build (cria a pasta dist ou build)
RUN npm run build

# --- Estágio 2: Produção (Nginx Leve) ---
FROM nginx:alpine

# Remove a config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa config personalizada (vamos criar abaixo)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do estágio anterior
# IMPORTANTE: Verifique se sua pasta de saída é 'dist' ou 'build' e ajuste abaixo
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
