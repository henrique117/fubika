# 🤖 Fubas Bot - Desenvolvimento

Este é o bot oficial do **Fubika**, desenvolvido em TypeScript utilizando a biblioteca `discord.js`.

## 🛠️ Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
* **Node.js** (Recomendado v20 ou superior)
* **NPM** (Geralmente vem com o Node)

## 🚀 Configuração do Ambiente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Já existe um ficheiro `.env.example` na raiz da pasta. Basta copiá-lo para um novo ficheiro chamado `.env`:
   ```bash
   cp .env.example .env
   ```
   Depois, preencha os campos obrigatórios no `.env`:
   - `TOKEN`: O token do seu bot no Discord Developer Portal.
   - `CLIENT_ID`: O ID da aplicação do bot.
   - `API_KEY`: A API key que precisa para passar da autenticação da API.

## 💻 Comandos Disponíveis

O projeto utiliza `tsx` para execução direta de TypeScript e `typescript` para compilação.

### 1. Modo de Desenvolvimento (Recomendado)
Este comando sincroniza os comandos Slash no Discord e inicia o bot com "hot-reload" (reinicia automaticamente ao salvar arquivos).
```bash
npm run dev
```

### 2. Build de Produção
Compila o código TypeScript para JavaScript dentro da pasta `dist/`.
```bash
npm run build
```

### 3. Rodar em Produção
Executa o servidor utilizando o código compilado (pasta dist) através do Node.js.
```bash
npm start
```

## 📁 Estrutura de Pastas

* `src/index.ts`: Ponto de entrada principal do bot.
* `src/deploy-commands.ts`: Script responsável por registar os comandos Slash na API do Discord.
* `src/commands/`: Pasta onde devem ser criados os ficheiros de comandos individuais.

## ⚖️ Licença
Este projeto utiliza a licença **ISC**. Verifique o ficheiro `LICENSE` na raiz do projeto principal para restrições de uso de portefólio.
