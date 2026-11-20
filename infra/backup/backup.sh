#!/bin/bash
# ==============================================================================
# Backup diário do MySQL do Fubika.
#
# Uso:
#   backup.sh          -> loop: espera até BACKUP_HOUR, faz o backup, repete
#   backup.sh --now    -> faz um backup agora e sai
#   BACKUP_NOW=1       -> mesmo efeito de --now, por variável de ambiente.
#                         É assim que o `make backup-now` chama, porque o
#                         `docker compose run` pode engolir um argumento que
#                         começa com '--' antes de entregá-lo ao container.
#
# Variáveis:
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS   (obrigatórias)
#   BACKUP_HOUR     hora do backup, 00-23           (padrão 04)
#   RETENTION_DAYS  dias de retenção                (padrão 7)
#   TZ              fuso usado no horário e no nome  (padrão America/Sao_Paulo)
#
# A senha NUNCA vai na linha de comando (seria visível em `ps` dentro do
# container): ela é escrita num arquivo temporário 0600 lido via
# --defaults-extra-file.
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_HOUR="${BACKUP_HOUR:-04}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

: "${DB_HOST:?DB_HOST não definido}"
: "${DB_NAME:?DB_NAME não definido}"
: "${DB_USER:?DB_USER não definido}"
: "${DB_PASS:?DB_PASS não definido}"
DB_PORT="${DB_PORT:-3306}"

log() { echo "[backup $(date '+%Y-%m-%d %H:%M:%S %Z')] $*"; }

CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT INT TERM
printf '[client]\nhost=%s\nport=%s\nuser=%s\npassword=%s\n' \
    "$DB_HOST" "$DB_PORT" "$DB_USER" "$DB_PASS" >"$CNF"

fazer_backup() {
    local arquivo tmp
    arquivo="${BACKUP_DIR}/fubika_$(date '+%Y-%m-%d_%H%M').sql.gz"
    tmp="${arquivo}.part"

    log "gerando ${arquivo}..."

    # --single-transaction: dump consistente sem travar as tabelas (InnoDB)
    # --quick:              não carrega tabelas inteiras na RAM (VM de 2 GB)
    # --no-tablespaces:     dispensa o privilégio global PROCESS
    # --routines:           inclui procedures/functions
    if mysqldump --defaults-extra-file="$CNF" \
        --single-transaction --quick --no-tablespaces --routines \
        "$DB_NAME" | gzip -c >"$tmp"; then
        mv "$tmp" "$arquivo"
        log "ok: $(du -h "$arquivo" | cut -f1) em ${arquivo}"
    else
        rm -f "$tmp"
        log "ERRO: mysqldump falhou, nada foi gravado"
        return 1
    fi

    # Retenção: apaga dumps mais velhos que RETENTION_DAYS dias.
    local removidos
    removidos="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'fubika_*.sql.gz' \
        -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)"
    if [ "$removidos" -gt 0 ]; then
        log "retenção: ${removidos} backup(s) com mais de ${RETENTION_DAYS} dias removido(s)"
    fi
}

segundos_ate_a_hora() {
    local alvo agora_h agora_m agora_s secs
    alvo="$((10#$BACKUP_HOUR))"
    agora_h="$((10#$(date '+%H')))"
    agora_m="$((10#$(date '+%M')))"
    agora_s="$((10#$(date '+%S')))"
    secs="$(((((alvo - agora_h + 24) % 24) * 3600) - (agora_m * 60) - agora_s))"
    if [ "$secs" -le 0 ]; then
        secs="$((secs + 86400))"
    fi
    echo "$secs"
}

if [ "${1:-}" = "--now" ] || [ "${BACKUP_NOW:-}" = "1" ]; then
    fazer_backup
    exit 0
fi

log "serviço iniciado (banco ${DB_NAME}@${DB_HOST}:${DB_PORT}, hora ${BACKUP_HOUR}h, retenção ${RETENTION_DAYS}d, TZ ${TZ:-padrão do sistema})"

while true; do
    espera="$(segundos_ate_a_hora)"
    log "próximo backup em ${espera}s"
    sleep "$espera"
    # Um erro num dia não derruba o serviço: ele tenta de novo no dia seguinte.
    fazer_backup || true
done
