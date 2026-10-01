#!/usr/bin/env bash
# Restaura un backup. Probarlo antes de la demo: un backup que nunca se restauró no está comprobado.
# Uso:
#   ./restaurar-mysql.sh /var/backups/checador/checador_2026-09-29_0300.sql.gz
#   ./restaurar-mysql.sh /var/backups/checador/checador_2026-09-29_0300.sql.gz /var/backups/checador/uploads_registro_2026-09-29_0300.tar.gz
set -euo pipefail

DB_NAME="${DB_NAME:-checador}"
UPLOADS_DIR="${UPLOADS_DIR:-/opt/checador/server/uploads}"
ARCHIVO_SQL="${1:?Indica el archivo .sql.gz}"
ARCHIVO_UPLOADS="${2:-}"

if [[ ! -f "$ARCHIVO_SQL" ]]; then
  echo "No existe el backup SQL: $ARCHIVO_SQL" >&2
  exit 1
fi

gunzip -c "$ARCHIVO_SQL" | mysql "$DB_NAME"
echo "Restaurado SQL en '$DB_NAME': $ARCHIVO_SQL"

if [[ -n "$ARCHIVO_UPLOADS" ]]; then
  if [[ ! -f "$ARCHIVO_UPLOADS" ]]; then
    echo "No existe el backup de fotos: $ARCHIVO_UPLOADS" >&2
    exit 1
  fi
  mkdir -p "$UPLOADS_DIR"
  tar -xzf "$ARCHIVO_UPLOADS" -C "$UPLOADS_DIR"
  echo "Restauradas fotos de registro en '$UPLOADS_DIR': $ARCHIVO_UPLOADS"
fi
