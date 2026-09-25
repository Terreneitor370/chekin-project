#!/usr/bin/env bash
# Actualiza el VPS con la última versión de main. Correr desde /opt/checador.
set -euo pipefail

git pull origin main

(cd server && npm ci --omit=dev)
(cd dashboard-tv && npm ci && npm run build && sudo rsync -a --delete dist/ /var/www/checador/tv/)
(cd panel-admin && npm ci && npm run build && sudo rsync -a --delete dist/ /var/www/checador/admin/)
(cd face-service && .venv/bin/pip install -q -r requirements.txt)

pm2 reload infra/ecosystem.config.cjs
echo "Despliegue terminado"
