FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1
WORKDIR /srv/root

RUN apt-get update --allow-releaseinfo-change && \
    apt-get install -y --no-install-recommends \
    git \
    curl \
    build-essential \
    default-mysql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock ./
RUN pip install -U pip poetry==2.2.1
RUN poetry config virtualenvs.create false
RUN poetry install --no-root

COPY . .

RUN chmod +x scripts/start_server.sh
RUN chmod +x scripts/wait-for-it.sh
RUN chmod +x scripts/install-nginx-config.sh

ENTRYPOINT [ "scripts/start_server.sh" ]