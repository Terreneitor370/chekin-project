#!/usr/bin/env bash
# Prueba de punta a punta: genera backup y valida restauración en una BD temporal.
# Uso:
#   DB_NAME=checador TEST_DB_NAME=checador_restore_test bash ./infra/scripts/probar-backup-restore.sh
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/checador}"
DB_NAME="${DB_NAME:-checador}"
TEST_DB_NAME="${TEST_DB_NAME:-${DB_NAME}_restore_test}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/checador}"
UPLOADS_TMP_DIR="${UPLOADS_TMP_DIR:-/tmp/checador-restore-check}"

BACKUP_SCRIPT="$REPO_DIR/infra/scripts/backup-mysql.sh"

if [[ ! -f "$BACKUP_SCRIPT" ]]; then
  echo "No existe el script de backup: $BACKUP_SCRIPT" >&2
  exit 1
fi

cleanup() {
  if ! mysql -e "DROP DATABASE IF EXISTS \`$TEST_DB_NAME\`;" >/dev/null 2>&1; then
    echo "Aviso: no se pudo eliminar la base temporal $TEST_DB_NAME" >&2
  fi
  rm -rf "$UPLOADS_TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$BACKUP_DIR"
DESTINO="$BACKUP_DIR" DB_NAME="$DB_NAME" "$BACKUP_SCRIPT"

shopt -s nullglob
sql_backups=("$BACKUP_DIR"/checador_*.sql.gz)
shopt -u nullglob
if ((${#sql_backups[@]} == 0)); then
  echo "No se encontró ningún backup SQL en $BACKUP_DIR" >&2
  exit 1
fi

IFS=$'\n' sorted_sql=($(printf '%s\n' "${sql_backups[@]}" | sort))
unset IFS
SQL_BACKUP="${sorted_sql[${#sorted_sql[@]}-1]}"
STAMP="$(basename "$SQL_BACKUP")"
STAMP="${STAMP#checador_}"
STAMP="${STAMP%.sql.gz}"
UPLOADS_BACKUP="$BACKUP_DIR/uploads_registro_${STAMP}.tar.gz"

mysql -e "DROP DATABASE IF EXISTS \`$TEST_DB_NAME\`; CREATE DATABASE \`$TEST_DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
gunzip -c "$SQL_BACKUP" | mysql "$TEST_DB_NAME"

TABLAS_ORIG="$(mysql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")"
TABLAS_TEST="$(mysql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$TEST_DB_NAME';")"
if [[ "$TABLAS_ORIG" != "$TABLAS_TEST" ]]; then
  echo "La restauración falló: tablas originales=$TABLAS_ORIG, restauradas=$TABLAS_TEST" >&2
  exit 1
fi

if [[ -f "$UPLOADS_BACKUP" ]]; then
  mkdir -p "$UPLOADS_TMP_DIR"
  tar -xzf "$UPLOADS_BACKUP" -C "$UPLOADS_TMP_DIR"
  if [[ ! -d "$UPLOADS_TMP_DIR/registro" ]]; then
    echo "La restauración de fotos falló: el backup no contiene carpeta 'registro'" >&2
    exit 1
  fi
  TOTAL_FOTOS="$(find "$UPLOADS_TMP_DIR/registro" -type f | wc -l | tr -d ' ')"
  echo "Backup de fotos validado (archivos en registro: $TOTAL_FOTOS)"
else
  echo "Aviso: no se encontró backup de fotos para el mismo timestamp ($UPLOADS_BACKUP)"
fi

echo "Prueba OK"
echo "- SQL backup: $SQL_BACKUP"
echo "- Base temporal restaurada: $TEST_DB_NAME"
