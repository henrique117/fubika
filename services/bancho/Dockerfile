# ==============================================================================
# Fubika — bancho (servidor do jogo, bancho.py / Python 3.11 + Poetry)
#
# Multi-stage: o estágio de build tem compilador e Poetry; a imagem final tem só
# o Python slim, o venv e o código. Roda como usuário não-root (uid 1000).
#
# Pontos sensíveis (confirmados lendo o código):
#   - TUDO é relativo ao CWD: app/settings.py abre "pyproject.toml" para pegar a
#     versão, app/logging.py abre "logging.yaml", e os caminhos de dados são
#     Path.cwd()/".data/...". Por isso WORKDIR=/srv/root nos DOIS estágios e o
#     pyproject.toml e o logging.yaml PRECISAM estar na imagem final.
#   - O venv é in-project (/srv/root/.venv). Os shebangs do venv têm caminho
#     absoluto, então o caminho tem que ser idêntico nos dois estágios.
#   - O venv é copiado INTEIRO (inclusive os *.dist-info): o comando !server usa
#     importlib.metadata.distributions() para listar versões.
#   - /srv/root/.data e seus subdiretórios são criados aqui já pertencendo ao
#     uid 1000. O app cria .data/ss e .data/assets/medals/client em runtime, sem
#     tratar erro: se o diretório pai fosse de root, o container não subiria.
#   - Em RUNTIME o bancho NÃO precisa de git, curl, cliente mysql nem redis-tools:
#     não há nenhuma chamada a binário externo no código (zero subprocess/Popen),
#     o banco é acessado por aiomysql/pymysql e o Redis pelo cliente Python.
# ==============================================================================

# ------------------------------------------------------------------ builder ---
FROM python:3.11-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_VIRTUALENVS_CREATE=true

WORKDIR /srv/root

# build-essential + python3-dev só existem AQUI. Em linux/amd64 quase tudo vem de
# wheel manylinux; eles são necessários para o py3rijndael (só tem sdist) e, em
# builds arm64, para compilar o psutil.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -U pip "poetry==2.2.1"

COPY pyproject.toml poetry.lock ./

# --only main: não instala o grupo dev (pre-commit, black, mypy...). Sem isso, o
# Poetry 2.x instalaria o grupo dev também.
# --no-root: o projeto é package-mode = false, não há nada para instalar dele.
RUN poetry install --only main --no-root && \
    rm -rf "$(poetry config cache-dir)"

# -------------------------------------------------------------------- final ---
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/srv/root/.venv \
    PATH=/srv/root/.venv/bin:$PATH

WORKDIR /srv/root

# Usuário não-root. A imagem python-slim não traz nenhum usuário com uid 1000.
RUN useradd --uid 1000 --user-group --create-home --shell /usr/sbin/nologin fubika

COPY --from=builder --chown=1000:1000 /srv/root/.venv /srv/root/.venv

# Só o que o processo realmente usa em runtime.
COPY --chown=1000:1000 pyproject.toml logging.yaml main.py ./
COPY --chown=1000:1000 app ./app
COPY --chown=1000:1000 tools ./tools

# Diretórios de dados. Os cinco primeiros recebem bind mount do compose; 'ss'
# (screenshots) também passou a ter volume próprio. Criados aqui com o dono certo
# para o caso de algum deles não vir montado.
RUN mkdir -p .data/avatars .data/logs .data/osu .data/osr .data/ss .data/assets && \
    chown -R 1000:1000 /srv/root/.data

USER 1000:1000

# Porta interna do bancho (APP_PORT no compose). Acima de 1024 porque o processo
# não é root e não tem CAP_NET_BIND_SERVICE.
EXPOSE 10000

CMD ["python", "main.py"]
