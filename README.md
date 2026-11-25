# 🚀 Fubika - Private osu! Server

<div align="center">
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-005863?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
    <br>
    <img src="https://img.shields.io/badge/License-All_Rights_Reserved-red?style=flat-square" alt="License">
    <a href="https://discord.gg/rUCxPEBjB8">
        <img src="https://img.shields.io/discord/1450592028147712173?color=7289DA&label=Discord&logo=discord&logoColor=white&style=flat-square" alt="Discord">
    </a>
</div>

---

## 🇧🇷 Português

**Fubika** é uma implementação customizada de servidor de osu!, baseada no projeto `bancho.py`. Este servidor foi desenvolvido com o objetivo de oferecer uma experiência estável, performática e com padrões de código modernos para a nossa comunidade privada.

### ⚠️ Fase Beta
Atualmente, o servidor encontra-se em **Fase Beta**. O foco está na estabilização das funcionalidades core (login, scores, performance). 

### 🎮 Como Conectar
Para jogar no Fubika, utilize o cliente oficial do osu! com a seguinte flag no atalho:
```text
-devserver fubika.com.br
```

---

## 🇺🇸 English

**Fubika** is a customized osu! server implementation based on the `bancho.py` project. This server was developed to provide a stable, high-performance experience with modern coding standards for our private community.

### ⚠️ Beta Phase
The server is currently in **Beta Phase**. Our focus is on stabilizing core functionalities (login, scores, performance).

### 🎮 How to Connect
To play on Fubika, use the official osu! client with the following flag in your shortcut:
```text
-devserver fubika.com.br
```

---

## 🛠️ Tecnologias Utilizadas / Tech Stack

* **Backend:** [Python](https://www.python.org/) 3.11+ com [FastAPI](https://fastapi.tiangolo.com/).
* **Database:** [MySQL](https://www.mysql.com/) para dados persistentes e [Redis](https://redis.io/) para cache de alta velocidade.
* **Infrastructure:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) para containerização.
* **Reverse Proxy:** [Caddy](https://caddyserver.com/) para gerenciamento de SSL e roteamento.

---

## 🤝 Como contribuir

### Fluxo de branches

```
sua-feature ──PR──► develop ──► staging automático ──PR──► main ──► produção
```

- Toda mudança entra por **PR**. `develop` e `main` são protegidas: sem push direto.
- O PR precisa passar nos checks `api`, `bot`, `web` e `docker` (CI do GitHub).
- Merge em `develop` → deploy automático em **staging** (`staging.fubika.com.br`).
- Merge de `develop` em `main` → **produção**, promovendo a MESMA imagem que já está
  rodando no staging (com aprovação manual).

### Primeira vez

```bash
git clone https://github.com/henrique117/fubika.git && cd fubika
cp .env.example .env     # preencha; é o ÚNICO arquivo de variáveis
make help                # lista todos os comandos
```

### Rodar só um serviço

Você **não** precisa subir a stack inteira: por padrão o front e o bot usam a API do
staging, e a API usa o banco do staging por um túnel SSH.

**Front (web)** — só precisa de Node:
```bash
make web          # Vite em http://localhost:5173, /api -> api.staging.fubika.com.br
```

**Bot** — com o SEU bot de teste (`DISCORD_TOKEN` + `DISCORD_GUILD_ID` no `.env`):
```bash
make deps                      # sobe só o Redis local, em Docker
make bot                       # bot rodando, API do staging
make fake-event type=snipe     # simula um evento de snipe do bancho
```

**API** — contra o banco e o Redis do staging:
```bash
make tunnel-staging    # deixe aberto (túnel SSH: 3307 MySQL, 6380 Redis)
make api               # API em http://localhost:3000
# make api-local       # alternativa: MySQL/Redis locais (make deps-db)
```

**Stack completa** (única forma de testar o bancho localmente):
```bash
make dev          # builda e sobe tudo em 127.0.0.1
make logs svc=bancho
```

Detalhes de arquitetura, deploy, rollback e backup: [`infra/README.md`](infra/README.md).

---

## ⚖️ Licença e Créditos / License and Credits

### Original Project
Fubika is a derivative work based on [**bancho.py**](https://github.com/osuAkatsuki/bancho.py), originally developed by the **Akatsuki** team ([cmyui](https://github.com/cmyui)). The base code is licensed under the **MIT License**.

### Fubika Customizations
As modificações, arquitetura de arquivos e lógica específica da versão **Fubika** são de **Direitos Reservados (Copyright © 2026)**. Este repositório é tornado público exclusivamente para fins de **portfólio profissional**.

> *All Fubika-specific modifications and logic are **All Rights Reserved**. This repository is public for **portfolio purposes only**.*

Consulte o arquivo `LICENSE` para mais detalhes.

<div align="center">
    Desenvolvido por Henrique Assis Moreira (Iccy) e equipe.
</div>
