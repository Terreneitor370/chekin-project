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
  validacion.js         esquemas zod de todo el contrato (400 DATOS_INVALIDOS)
  middlewares/          auth (roles, vinculación, TV), uploads, validar, errores
  routes/               un archivo por recurso del contrato
  services/
    firma.js            verificación SHA256withRSA de la huella
    faceClient.js       llamadas al face-service (DeepFace)
    asistencia.js       duplicados, entrada/salida, tardanza
    estadoTv.js         estado completo del día para la TV
    eventos.js          nuevo-checkin, nuevo-aviso, nuevo-multimedia
    archivos.js         guardado en uploads/
  utils/                errores del contrato, zona horaria
test/                   pruebas con node:test (no tocan la BD)
scripts/
  hash.js               genera hash bcrypt para seed.sql
  probar-firma.js       prueba la verificación de firma sin teléfono
  simular-flujo.js      recorre el flujo completo sin teléfono
uploads/                registro/ (privada), checkins/ (con token), multimedia/ (pública)
```

## Pruebas

```bash
npm test
```

58 pruebas de `validacion`, `firma` y `tiempo`. No necesitan MySQL ni face-service,
solo que exista `server/.env` (lo carga `src/config.js`). Son las que se ejecutan
antes de cada PR.

## Prueba del Día 1

```bash
npm run probar-firma
# Con datos reales del Oppo de Isabel:
npm run probar-firma -- "<llavePublica>" "<reto>" "<firma>"
```

## Pendientes (Kassandra)

- [x] Validar cuerpos de petición con un esquema (zod) → `src/validacion.js`
- [x] Pruebas de `validacion`, `firma` y `tiempo` → `test/`
- [ ] Probar el flujo completo con el face-service real (requiere `/face-service` de Jeshua)
- [ ] Revisar mensajes de error con Isabel (app) y Jorge (panel)

## Detalles que conviene hablar con el equipo

- **`GET /api/checkins?fecha=`** ahora rechaza fechas mal formadas (antes devolvía `200 []`
  en silencio). Mismo criterio que ya usaba `/api/reportes/asistencia`.
- **`formato=json|csv`** en reportes: cualquier otro valor da 400 en vez de devolver JSON.
  Avisar a Jorge por si su panel manda otra cosa.
- **Los `PUT` usan `COALESCE`**, así que mandar `null` en `email`, `fechaInicio` o
  `fechaFin` **no borra** el valor: no se toca. Si el panel necesita limpiarlos hay que
  reescribir el `UPDATE` sin `COALESCE`.
- **Un fallo después de consumir el reto obliga a pedir uno nuevo.** Si el check-in falla
  por cualquier motivo posterior a la firma (por ejemplo `503` de face-service), el reto ya
  quedó marcado como usado. La app debe pedir otro reto, no reintentar con el mismo.
- **`El empleado no tiene foto de registro`** responde 400 `DATOS_INVALIDOS`, aunque el
  dato inválido sea el estado del servidor, no lo que mandó la app. Propuesta: 409.

