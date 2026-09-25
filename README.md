# Checador Inteligente con Roku

Práctica de **Desarrollo de Equipo Inteligente**: pantalla inteligente (Roku) con información en tiempo real,
avisos y multimedia, y un checador que autentica con la **huella** del celular y verifica el **rostro** con DeepFace.

![Arquitectura](docs/arquitectura.png)

## Equipo

| Dev | Integrante | Rol | Carpeta |
|---|---|---|---|
| 1 | Isabel Celis | Mobile (React Native + Expo) | `/mobile` |
| 2 | Kassandra Cuadras | Backend (Node.js + Socket.IO + MySQL) | `/server` |
| 3 | Jorge Ramírez | Frontend (dashboard del Roku + panel admin) | `/dashboard-tv`, `/panel-admin` |
| 4 | Jeshua E. Pérez | Datos + infraestructura + QA + servicio facial | `/database`, `/infra`, `/face-service` |

**Regla de oro:** cada quien es dueño de su carpeta; nadie toca el código de otro sin avisar; nos comunicamos por el
[contrato de API](docs/api.md).

## Estructura

```
chekin-project/
├── mobile/          App del checador (Expo): huella + selfie          -> Isabel
├── server/          API REST + Socket.IO                              -> Kassandra
├── dashboard-tv/    Web para el navegador del Roku                    -> Jorge
├── panel-admin/     Panel web de RH                                   -> Jorge
├── database/        schema.sql + seed.sql                             -> Jeshua
├── face-service/    Python + DeepFace (interno)                       -> Jeshua
├── infra/           Nginx, PM2, backups, despliegue                   -> Jeshua
├── docs/            Contrato de API, arquitectura, convenciones, plan -> Todos
└── .github/         CODEOWNERS y plantilla de Pull Request
```

## Arranque rápido en local

Requisitos: Node.js 20+, MySQL 8, Python 3.10-3.12; para la app, Android Studio + JDK 17 y un teléfono Android.

```bash
# 1. Base de datos
mysql -u root -p < database/schema.sql
mysql -u root -p checador < database/seed.sql

# 2. face-service (terminal 1)
cd face-service && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && uvicorn main:app --host 127.0.0.1 --port 8000

# 3. API (terminal 2)
cd server && cp .env.example .env && npm install && npm run dev

# 4. Dashboard del Roku (terminal 3) -> http://localhost:5174/tv/?token=tv-demo-token-cambiar
cd dashboard-tv && npm install && npm run dev

# 5. Panel admin (terminal 4) -> http://localhost:5173/admin/  (admin@checador.local / Admin123!)
cd panel-admin && npm install && npm run dev

# 6. App móvil (teléfono conectado por USB)
cd mobile && cp .env.example .env && npm install && npx expo run:android
```

Simular el flujo completo sin teléfono: `cd server && FOTO_REGISTRO=yo1.jpg SELFIE=yo2.jpg npm run simular`

## Documentación

- [Contrato de API y eventos](docs/api.md)
- [Arquitectura y decisiones](docs/arquitectura.md)
- [Convenciones (ramas, commits, PR)](docs/convenciones.md)
- [Plan de 7 días y pruebas](docs/plan-7-dias.md)

## Credenciales de prueba (cambiar antes de publicar)

| Qué | Valor |
|---|---|
| Admin del panel | `admin@checador.local` / `Admin123!` |
| Supervisor | `supervisor@checador.local` / `Super123!` |
| Token de la TV | `tv-demo-token-cambiar` |
