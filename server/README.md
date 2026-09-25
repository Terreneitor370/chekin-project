# /server

**Dueña:** Kassandra Cuadras (Dev 2)

API REST + Socket.IO del checador. Contrato completo en [`../docs/api.md`](../docs/api.md).

## Requisitos

- Node.js 20 o superior
- MySQL 8 con `database/schema.sql` y `database/seed.sql` cargados
- face-service corriendo en `FACE_SERVICE_URL` (ver `../face-service`)

## Correr en local

```bash
cp .env.example .env      # llenar DB_USER, DB_PASSWORD y JWT_SECRET
npm install
npm run dev               # http://localhost:3000/health
```

## Estructura

```
src/
  index.js              arranque HTTP + Socket.IO
  app.js                middlewares y rutas
  config.js             variables de entorno
  db.js                 pool mysql2 (consultas parametrizadas)
  socket.js             sala "tv" autenticada con token
  middlewares/          auth (roles, vinculación, TV), uploads, errores
  routes/               un archivo por recurso del contrato
  services/
    firma.js            verificación SHA256withRSA de la huella
    faceClient.js       llamadas al face-service (DeepFace)
    asistencia.js       duplicados, entrada/salida, tardanza
    estadoTv.js         estado completo del día para la TV
    eventos.js          nuevo-checkin, nuevo-aviso, nuevo-multimedia
    archivos.js         guardado en uploads/
  utils/                errores del contrato, zona horaria
scripts/
  hash.js               genera hash bcrypt para seed.sql
  probar-firma.js       prueba la verificación de firma sin teléfono
uploads/                registro/ (privada), checkins/ (con token), multimedia/ (pública)
```

## Prueba del Día 1

```bash
npm run probar-firma
# Con datos reales del Oppo de Isabel:
npm run probar-firma -- "<llavePublica>" "<reto>" "<firma>"
```

## Pendientes (Kassandra)

- [ ] Validar cuerpos de petición con un esquema (zod o similar)
- [ ] Probar el flujo completo con el face-service real
- [ ] Revisar mensajes de error con Isabel (app) y Jorge (panel)
