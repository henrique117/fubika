# ==============================================================================
# Fubika — serviço de backup do MySQL
#
# Base mysql:8.0 (mesma versão do banco) para garantir que o mysqldump é
# compatível com o servidor. A imagem oficial é Oracle Linux, por isso
# microdnf. gzip comprime o dump; tzdata faz o TZ (America/Sao_Paulo) valer
# para o cálculo do horário do backup.
# ==============================================================================
FROM mysql:8.0

RUN microdnf install -y gzip tzdata && microdnf clean all

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod 0755 /usr/local/bin/backup.sh

# Roda sem privilégios. O uid 1000 precisa ser dono de ./backups no host
# (chown -R 1000:1000 backups) para conseguir escrever os dumps.
USER 1000

WORKDIR /backups

# Sobrescreve o entrypoint da imagem oficial (que subiria um mysqld).
ENTRYPOINT ["/usr/local/bin/backup.sh"]
