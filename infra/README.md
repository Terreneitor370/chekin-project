# /infra

**Dueño:** Jeshua E. Pérez (Dev 4)

Configuración del VPS Ubuntu (PDF: Nginx + PM2 + Certbot + ufw + backups).

| Archivo | Para qué |
|---|---|
| `nginx/checador.conf` | Proxy de `/api`, `/socket.io`, `/uploads`; sirve `/tv` y `/admin` |
| `ecosystem.config.cjs` | PM2 para `checador-api` (Node) y `checador-face` (DeepFace) |
| `scripts/desplegar.sh` | `git pull` + builds + normaliza PM2 (`checador-api`/`checador-face`) + health checks |
| `scripts/configurar-https.sh` | Publica Nginx con dominio real y emite certificado Let's Encrypt |
| `scripts/backup-mysql.sh` | Backup diario (MySQL + fotos de registro), guarda 7 días |
| `scripts/restaurar-mysql.sh` | Restaurar backup SQL y (opcionalmente) fotos de registro |
| `scripts/probar-backup-restore.sh` | Prueba end-to-end: genera backup y valida restauración en BD temporal |

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
sudo bash ./infra/scripts/configurar-https.sh checador.tudominio.com tu-correo@dominio.com

# 7. PM2 al arranque y backups
pm2 save && pm2 startup
(crontab -l; echo "0 3 * * * /opt/checador/infra/scripts/backup-mysql.sh >> /var/log/checador-backup.log 2>&1") | crontab -
```

## Requisitos del VPS

- Al menos 2 vCPU y 4 GB de RAM (DeepFace en CPU usa 1.5 a 3 GB).
- MySQL solo en localhost; el face-service solo en 127.0.0.1:8000.

## Despliegue diario recomendado

```bash
cd /opt/checador
bash ./infra/scripts/desplegar.sh
```

El script:
- actualiza código (`git pull origin main`),
- reconstruye frontend y reinstala dependencias del backend,
- asegura/actualiza el `venv` del face-service e instala `requirements.txt`,
- predescarga el modelo de DeepFace (`FACE_MODEL`, por defecto `Facenet512`),
- elimina un proceso PM2 legado llamado `backend` (si existe),
- arranca o reinicia `checador-api` y `checador-face`,
- ejecuta `pm2 save`,
- y valida `http://127.0.0.1:8000/health` + `http://127.0.0.1:3000/health` (requiere `"faceService":true`).

## URL que se abre en el Roku

`https://<dominio>/tv/?token=<TV_TOKEN>` (el token de prueba es `tv-demo-token-cambiar`; cambiarlo en producción).

## Validaciones de pre-demo (Jeshua)

### 1) HTTPS en VPS

```bash
cd /opt/checador
sudo bash ./infra/scripts/configurar-https.sh checador.tudominio.com tu-correo@dominio.com
curl -I https://checador.tudominio.com/health
```

Esperado: `HTTP/2 200` y certificado válido.

### 2) Backup + restore probado (no solo cron)

```bash
cd /opt/checador
bash ./infra/scripts/probar-backup-restore.sh
```

La prueba:
- ejecuta `backup-mysql.sh`,
- restaura el SQL en una BD temporal (`checador_restore_test`),
- valida que el número de tablas restauradas coincida con producción,
- y valida el `.tar.gz` de fotos de registro si existe para ese timestamp.

Nota: el usuario MySQL configurado en `~/.my.cnf` debe tener permisos para `CREATE/DROP DATABASE`
de la base temporal usada en la prueba.

Para restauración manual completa (BD + fotos), usar:

```bash
bash ./infra/scripts/restaurar-mysql.sh /var/backups/checador/checador_YYYY-MM-DD_HHMM.sql.gz /var/backups/checador/uploads_registro_YYYY-MM-DD_HHMM.tar.gz
```

## Pendientes (Jeshua)

- [ ] Dominio y HTTPS funcionando
- [ ] Probar restauración de backup antes de la demo
- [ ] Plan B: backend local en una laptop
