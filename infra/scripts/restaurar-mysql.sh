#!/usr/bin/env bash
# Restaura un backup. Probarlo antes de la demo: un backup que nunca se restauró no está comprobado.
# Uso: ./restaurar-mysql.sh /var/backups/checador/checador_2026-09-29_0300.sql.gz
set -euo pipefail
ARCHIVO="${1:?Indica el archivo .sql.gz}"
gunzip -c "$ARCHIVO" | mysql checador
echo "Restaurado: $ARCHIVO"
