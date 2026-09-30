#!/usr/bin/env bash
# Configura Nginx + HTTPS (Certbot) para el dominio real del VPS.
# Uso (como root o con sudo):
#   sudo bash ./infra/scripts/configurar-https.sh checador.tudominio.com tu-correo@dominio.com
set -euo pipefail

DOMINIO="${1:?Indica el dominio real, por ejemplo checador.tudominio.com}"
EMAIL="${2:?Indica el correo para Lets Encrypt}"
REPO_DIR="${REPO_DIR:-/opt/checador}"
NOMBRE_SITIO="${NOMBRE_SITIO:-checador}"
PLANTILLA="$REPO_DIR/infra/nginx/checador.conf"
SITIO_AVAILABLE="/etc/nginx/sites-available/$NOMBRE_SITIO"
SITIO_ENABLED="/etc/nginx/sites-enabled/$NOMBRE_SITIO"

if [[ "$EUID" -ne 0 ]]; then
  echo "Este script requiere permisos de root. Ejecuta con sudo." >&2
  exit 1
fi

if [[ "$DOMINIO" == "checador.ejemplo.com" ]]; then
  echo "Debes usar tu dominio real, no el placeholder checador.ejemplo.com" >&2
  exit 1
fi

if [[ ! -f "$PLANTILLA" ]]; then
  echo "No existe la plantilla de Nginx: $PLANTILLA" >&2
  exit 1
fi

TMP_CONF="$(mktemp)"
trap 'rm -f "$TMP_CONF"' EXIT

sed "s/server_name checador\\.ejemplo\\.com;/server_name ${DOMINIO};/" "$PLANTILLA" > "$TMP_CONF"

install -m 644 "$TMP_CONF" "$SITIO_AVAILABLE"
ln -sfn "$SITIO_AVAILABLE" "$SITIO_ENABLED"

nginx -t
systemctl reload nginx

if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
fi

certbot --nginx \
  -d "$DOMINIO" \
  --agree-tos \
  -m "$EMAIL" \
  --redirect \
  --non-interactive \
  --keep-until-expiring

nginx -t
systemctl reload nginx

echo "HTTPS configurado correctamente para https://$DOMINIO"
