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
   Existe **um único** `.env`, na raiz do repositório (não há `.env` aqui dentro).
   ```bash
   cd ../..          # raiz do repo
   cp .env.example .env
   ```
   Para rodar o bot, preencha:
   - `DISCORD_TOKEN`: token do **seu** bot de teste (Discord Developer Portal).
   - `CLIENT_ID`: Application ID do mesmo bot.
   - `DISCORD_GUILD_ID`: sua guild de teste — com ela preenchida, os slash commands
     são registrados só lá e aparecem na hora (vazio = registro global, até 1h).
   - `API_KEY`: chave usada para autenticar na API do Fubika.
   - `LOCAL_REDIS_URL`: Redis local, de onde o bot escuta os eventos de snipe.

   > O carregamento é feito pelo `--env-file` do Node (sem `dotenv`), e o
   > `make bot` ainda sobrescreve `API_URL` para apontar para a API do staging.

## 💻 Comandos Disponíveis

O projeto utiliza `tsx` para execução direta de TypeScript e `typescript` para compilação.
O guia de testes do MCP/LLM está em [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md).

### 1. Modo de Desenvolvimento (Recomendado)
Pela raiz do repositório (jeito recomendado — confere o Redis local, aponta a API
para o staging e avisa o que estiver faltando):
```bash
make deps    # sobe só o Redis local, em Docker
make bot
```
Direto por aqui também funciona (sincroniza os comandos Slash e sobe com hot-reload):
```bash
npm run dev
```

Para simular um evento de snipe/top1 sem depender do bancho:
```bash
make fake-event type=snipe          # na raiz do repo
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
