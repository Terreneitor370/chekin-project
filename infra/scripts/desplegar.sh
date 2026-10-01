#!/usr/bin/env bash
# Actualiza el VPS con la ultima version de main. Correr desde /opt/checador.
set -euo pipefail

cd "$(dirname "$0")/../.."

git pull origin main

(cd server && npm ci --omit=dev)
(cd dashboard-tv && npm ci && npm run build && sudo rsync -a --delete dist/ /var/www/checador/tv/)
(cd panel-admin && npm ci && npm run build && sudo rsync -a --delete dist/ /var/www/checador/admin/)
if [ ! -x face-service/.venv/bin/python ]; then
  python3 -m venv face-service/.venv
fi
(cd face-service && .venv/bin/pip install -q -r requirements.txt)
(cd face-service && FACE_MODEL="${FACE_MODEL:-Facenet512}" .venv/bin/python -c "import os; from deepface import DeepFace; DeepFace.build_model(os.getenv('FACE_MODEL', 'Facenet512'))")

pm2 delete backend >/dev/null 2>&1 || true

if pm2 describe checador-api >/dev/null 2>&1; then
  pm2 restart checador-api --update-env
else
  pm2 start infra/ecosystem.config.cjs --only checador-api --update-env
fi

if pm2 describe checador-face >/dev/null 2>&1; then
  pm2 restart checador-face --update-env
else
  pm2 start infra/ecosystem.config.cjs --only checador-face --update-env
fi

pm2 save

curl -fsS http://127.0.0.1:8000/health >/dev/null
api_health="$(curl -fsS http://127.0.0.1:3000/health)"
echo "$api_health" | grep -q '"faceService":true'

echo "Despliegue terminado (API y face-service saludables)"
