# 💻 Fubika - Frontend Service

Este é o serviço de interface web do **Fubika**, desenvolvido com **React 19**, **TypeScript** e **Vite**. O objetivo deste projeto é fornecer uma experiência de usuário fluida e moderna para os jogadores do servidor.

<div align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router">
</div>

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** React 19 (Functional Components & Hooks)
* **Build Tool:** Vite (para um desenvolvimento extremamente rápido)
* **Linguagem:** TypeScript (Type-safety)
* **Roteamento:** React Router 7
* **Comunicação:** Axios para consumo da API

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
* **Node.js** (Versão 20 ou superior recomendada)
* **NPM** ou **Yarn**

### Passo a Passo

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O site estará disponível por padrão em `http://localhost:5173`.

> **Nota sobre a API:** não existe `.env` dentro deste serviço — o Vite lê o `.env`
> único da raiz do repositório (`envDir`), e só variáveis `VITE_*` chegam ao
> navegador. Em desenvolvimento, `/api` é um proxy para
> `https://api.<VITE_DEV_DOMAIN>` (padrão: `staging.fubika.com.br`), então você
> trabalha contra a API do staging sem subir nada local.
>
> Em produção e staging **nada de URL é embutido no build**: `src/config.ts` deriva
> API, avatares e assets de `window.location.hostname` em runtime — é isso que
> permite promover a mesma imagem do staging para a produção.
>
> O jeito recomendado de subir é `make web`, na raiz do repositório.

---

## 📦 Scripts Disponíveis

No diretório do projeto, você pode executar:

* **`npm run dev`**: Roda o aplicativo em modo de desenvolvimento.
* **`npm run build`**: Compila o aplicativo para produção na pasta `dist/`. O build é otimizado e passa pela checagem do TypeScript.
* **`npm run lint`**: Executa o ESLint para encontrar e corrigir problemas de padronização no código.
* **`npm run preview`**: Visualiza localmente o build de produção gerado.

---

## 🎨 Design & Estrutura
O design segue as diretrizes estabelecidas no Figma do projeto.

## ⚖️ Licença
Este projeto segue a licença de **Direitos Reservados** estabelecida no repositório principal. O código é tornado público exclusivamente para fins de consulta de portfólio profissional.
