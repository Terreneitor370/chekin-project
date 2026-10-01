#!/usr/bin/env bash
# Backup diario de MySQL (PDF: "Backups automáticos de MySQL con cron diario").
# Cron (3 am):  0 3 * * * /opt/checador/infra/scripts/backup-mysql.sh >> /var/log/checador-backup.log 2>&1
# Credenciales en ~/.my.cnf del usuario que corre el cron (no en este archivo).
set -euo pipefail

DESTINO="${DESTINO:-/var/backups/checador}"
DIAS="${DIAS:-7}"
DB_NAME="${DB_NAME:-checador}"
UPLOADS_DIR="${UPLOADS_DIR:-/opt/checador/server/uploads}"
FECHA="$(date +%F_%H%M)"

mkdir -p "$DESTINO"
mysqldump --single-transaction --routines "$DB_NAME" | gzip > "$DESTINO/checador_$FECHA.sql.gz"
# Fotos de registro (necesarias para verificar rostros)
if [[ -d "$UPLOADS_DIR/registro" ]]; then
  tar -czf "$DESTINO/uploads_registro_$FECHA.tar.gz" -C "$UPLOADS_DIR" registro
else
  echo "$(date -Is) aviso: se omite backup de fotos porque no existe $UPLOADS_DIR/registro" >&2
fi
find "$DESTINO" -type f -mtime +"$DIAS" -delete
echo "$(date -Is) backup OK: $FECHA (db=$DB_NAME, destino=$DESTINO)"
