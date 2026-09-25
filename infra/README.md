# /infra

**Dueño:** Jeshua E. Pérez (Dev 4)

Configuración del VPS Ubuntu (PDF: Nginx + PM2 + Certbot + ufw + backups).

| Archivo | Para qué |
|---|---|
| `nginx/checador.conf` | Proxy de `/api`, `/socket.io`, `/uploads`; sirve `/tv` y `/admin` |
| `ecosystem.config.cjs` | PM2 para `checador-api` (Node) y `checador-face` (DeepFace) |
| `scripts/desplegar.sh` | `git pull` + builds + recarga de PM2 |
| `scripts/backup-mysql.sh` | Backup diario (MySQL + fotos de registro), guarda 7 días |
| `scripts/restaurar-mysql.sh` | Restaurar un backup |

## Instalación inicial del VPS (una vez)

```bash
# 1. Paquetes
sudo apt update && sudo apt install -y nginx mysql-server python3-venv git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2

# 2. Firewall (PDF: solo 22, 80, 443)
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable

# 3. Código
sudo git clone https://github.com/Terreneitor370/chekin-project.git /opt/checador
cd /opt/checador

# 4. Base de datos
sudo mysql < database/schema.sql && sudo mysql checador < database/seed.sql
# crear usuario 'checador' (ver database/README.md)

# 5. Backend y face-service
cp server/.env.example server/.env   # llenar valores reales
(cd face-service && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt)
# Descargar los pesos del modelo AHORA (no en la demo):
(cd face-service && .venv/bin/python -c "from deepface import DeepFace; DeepFace.build_model('Facenet512')")

# 6. Frontends + Nginx + HTTPS
sudo mkdir -p /var/www/checador/tv /var/www/checador/admin
./infra/scripts/desplegar.sh
sudo cp infra/nginx/checador.conf /etc/nginx/sites-available/checador
sudo ln -s /etc/nginx/sites-available/checador /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d checador.ejemplo.com

# 7. PM2 al arranque y backups
pm2 save && pm2 startup
(crontab -l; echo "0 3 * * * /opt/checador/infra/scripts/backup-mysql.sh >> /var/log/checador-backup.log 2>&1") | crontab -
```

## Requisitos del VPS

- Al menos 2 vCPU y 4 GB de RAM (DeepFace en CPU usa 1.5 a 3 GB).
- MySQL solo en localhost; el face-service solo en 127.0.0.1:8000.

## URL que se abre en el Roku

`https://<dominio>/tv/?token=<TV_TOKEN>` (el token de prueba es `tv-demo-token-cambiar`; cambiarlo en producción).

## Pendientes (Jeshua)

- [ ] Dominio y HTTPS funcionando
- [ ] Probar restauración de backup antes de la demo
- [ ] Plan B: backend local en una laptop
