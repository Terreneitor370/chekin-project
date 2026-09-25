#!/usr/bin/env bash
# Backup diario de MySQL (PDF: "Backups automáticos de MySQL con cron diario").
# Cron (3 am):  0 3 * * * /opt/checador/infra/scripts/backup-mysql.sh >> /var/log/checador-backup.log 2>&1
# Credenciales en ~/.my.cnf del usuario que corre el cron (no en este archivo).
set -euo pipefail

DESTINO="${DESTINO:-/var/backups/checador}"
DIAS="${DIAS:-7}"
FECHA="$(date +%F_%H%M)"

mkdir -p "$DESTINO"
mysqldump --single-transaction --routines checador | gzip > "$DESTINO/checador_$FECHA.sql.gz"
# Fotos de registro (necesarias para verificar rostros)
tar -czf "$DESTINO/uploads_registro_$FECHA.tar.gz" -C /opt/checador/server/uploads registro 2>/dev/null || true
find "$DESTINO" -type f -mtime +"$DIAS" -delete
echo "$(date -Is) backup OK: $FECHA"
