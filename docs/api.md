# Contrato de API

Fuente de verdad entre `/mobile`, `/server`, `/dashboard-tv`, `/panel-admin` y `/face-service`.
**Regla:** si un endpoint o evento cambia, primero se actualiza este archivo por Pull Request y después se programa.

- Base URL: `https://<dominio>/api` (local: `http://localhost:3000/api`)
- Formato: JSON en UTF-8, salvo los endpoints que suben imágenes (`multipart/form-data`).
- Fechas: ISO 8601 en UTC (`2026-09-29T15:04:05.000Z`) para check-ins, retos, códigos y tokens. "Hoy" y las tardanzas se calculan en `America/Hermosillo`.
- Los campos `fechaInicio`/`fechaFin` de los **avisos** y `desde`/`hasta` de **reportes y consultas** se envían SOLO como `AAAA-MM-DD` (sin hora); el servidor responde 400 si llega con hora (`usa el formato AAAA-MM-DD`).

## Roles

| Rol | Dónde vive | Cómo entra | Qué puede hacer |
|---|---|---|---|
| `admin` | tabla `usuarios` | Panel web (email + contraseña) | Todo: registra usuarios del panel y empleados, genera códigos de registro, desactiva, avisos, multimedia, reportes |
| `supervisor` | tabla `usuarios` | Panel web (email + contraseña) | Ve y opera el día a día: check-ins, reportes, avisos, multimedia y empleados. **No** crea, edita ni desactiva empleados, **no** edita ni desactiva multimedia, y **no** toca usuarios |
| `empleado` | tabla `empleados` | App móvil (huella + rostro, sin contraseña) | Hacer check-in y ver su propio dashboard (`/api/mi/...`) |

Si un admin o supervisor también checa, además necesita su registro en `empleados` y su teléfono vinculado.

## Tipos de acceso

| Tipo | Quién | Cómo se envía |
|---|---|---|
| Público | Cualquiera | Sin credencial |
| Vinculación | App móvil durante el registro (15 min) | `Authorization: Bearer <tokenVinculacion>` |
| Firma | App móvil en cada check-in | Campos `empleadoId`, `retoId` y `firma` en el cuerpo |
| TV | Dashboard del Roku | `?token=<TV_TOKEN>` en la URL y en el handshake de Socket.IO |
| Admin / Supervisor | Panel web | `Authorization: Bearer <JWT>` (guardar en memoria, no en localStorage) |
| Empleado | App móvil, después de firmar con la huella | `Authorization: Bearer <tokenEmpleado>` (8 h, solo para `/api/mi/...`) |

## Formato de error (todos los endpoints)

```json
{ "error": { "codigo": "FIRMA_INVALIDA", "mensaje": "No pudimos validar tu huella" } }
```

| HTTP | codigo | Cuándo |
|---|---|---|
| 400 | `DATOS_INVALIDOS` | Falta un campo, tiene formato incorrecto o el JSON está malformado |
| 400 | `IMAGEN_INVALIDA` | Archivo que no es imagen o está corrupto |
| 401 | `NO_AUTENTICADO` | Falta token o expiró |
| 401 | `FIRMA_INVALIDA` | La firma no coincide con la llave registrada |
| 401 | `RETO_INVALIDO` | Reto inexistente, usado o expirado |
| 403 | `SIN_PERMISO` | El rol no puede hacer esa acción |
| 403 | `ROSTRO_NO_COINCIDE` | DeepFace no verificó a la persona |
| 403 | `ROSTRO_NO_REAL` | anti_spoofing detectó foto impresa o pantalla |
| 404 | `NO_ENCONTRADO` | El recurso no existe |
| 409 | `DUPLICADO` | Check-in del mismo empleado hace menos de 5 min |
| 422 | `SIN_ROSTRO` | La foto no tiene exactamente un rostro claro |
| 429 | `DEMASIADAS_SOLICITUDES` | Rate limit |
| 503 | `SERVICIO_FACIAL_NO_DISPONIBLE` | face-service no responde |

---

## 1. Salud

### `GET /health` (público)
```json
{ "ok": true, "db": true, "faceService": true, "hora": "2026-09-29T15:04:05.000Z" }
```

## 2. Autenticación del panel

### `POST /api/auth/login` (público)
Petición:
```json
{ "email": "admin@checador.local", "password": "Admin123!" }
```
Respuesta 200:
```json
{ "token": "<JWT 1h>", "usuario": { "id": 1, "email": "admin@checador.local", "rol": "admin" } }
```

## 3. Registro del celular (una sola vez por empleado)

### `POST /api/dispositivos/vincular` (público, con código válido)
El admin genera el código en el panel (sección 6). Vigencia: 15 minutos, un solo uso.
```json
{ "codigo": "482913" }
```
Respuesta 200:
```json
{
  "tokenVinculacion": "<JWT 15 min>",
  "empleado": { "id": 3, "nombre": "Isabel Celis" }
}
```

### `POST /api/biometria/registrar` (vinculación)
La app llama `createKeys()` de react-native-biometrics (pide la huella) y envía la llave pública.
```json
{ "llavePublica": "MIIBIjANBgkqh...IDAQAB", "dispositivo": "OPPO Reno 14 / Android 15" }
```
Respuesta 201:
```json
{ "huellaId": 7, "empleadoId": 3 }
```
- `llavePublica`: base64 de la llave RSA 2048 (X.509 / SubjectPublicKeyInfo), tal como la devuelve la librería.
  **En Android trae saltos de línea** (`Base64.DEFAULT`): el servidor debe quitar espacios y saltos antes de validar. Lo mismo aplica a `firma`.
- Registrar de nuevo desactiva la huella anterior del empleado.

### `POST /api/empleados/foto-registro` (vinculación, multipart)
| Campo | Tipo | Nota |
|---|---|---|
| `foto` | archivo JPEG | Cámara frontal, de frente, buena luz, máx. 1024 px |

Respuesta 201: `{ "ok": true }`. Error 422 `SIN_ROSTRO` si la foto no tiene exactamente un rostro claro.

## 4. Check-in

### `GET /api/checkin/reto?empleadoId=3` (público)
Respuesta 200:
```json
{ "retoId": 1542, "reto": "c3f1a9e0-5b1c-4c6e-9d7a-2f0e8b6a1d44", "expiraEn": "2026-09-29T15:05:05.000Z" }
```
- Vigencia: 60 s. Un solo uso.

### `POST /api/checkin` (firma, multipart)
La app llama `createSignature({ payload: reto })` (pide la huella) y toma la selfie.

| Campo | Tipo | Nota |
|---|---|---|
| `empleadoId` | número | Guardado en SecureStore al registrarse |
| `retoId` | número | Del endpoint anterior |
| `firma` | texto base64 | `signature` devuelta por la librería |
| `idempotencyKey` | texto UUID | Uno nuevo por intento; se reutiliza si la red reintenta |
| `selfie` | archivo JPEG | Máx. 1024 px, calidad 70% |

**Qué se firma:** exactamente el texto de `reto`, sin cambios. Algoritmo: `SHA256withRSA` (PKCS#1 v1.5).

Respuesta 201:
```json
{
  "checkin": { "id": 88, "tipo": "entrada", "tarde": false, "registradoEn": "2026-09-29T15:04:05.000Z" },
  "empleado": { "id": 3, "nombre": "Isabel Celis" },
  "verificacion": { "verificado": true, "distancia": 0.31, "esReal": true }
}
```
Errores posibles: `RETO_INVALIDO`, `FIRMA_INVALIDA`, `ROSTRO_NO_COINCIDE`, `ROSTRO_NO_REAL`, `SIN_ROSTRO`, `DUPLICADO`, `SERVICIO_FACIAL_NO_DISPONIBLE`.

**El reto se gasta en cuanto el servidor lo recibe**, aunque el check-in falle después (por ejemplo 503 de DeepFace o rostro no verificado).
Para reintentar, la app pide un **reto nuevo** y vuelve a firmar con la huella. Solo se reenvía la misma petición (mismo `idempotencyKey`) si la red se cortó y no hubo respuesta: el servidor devuelve el resultado original.

La respuesta 201 incluye además `"tokenEmpleado": "<JWT 8 h>"` para abrir "Mi asistencia" sin pedir otra huella.

Reglas del servidor:
- Hora del registro: la del servidor, nunca la del teléfono.
- `tipo`: el primer registro del día es `entrada`; el siguiente, `salida`.
- `tarde`: `entrada` después de `hora_entrada + tolerancia_min` del empleado.
- Duplicado: mismo empleado en menos de 5 minutos.

## 4.1 Dashboard del empleado (rol `empleado`)

### `POST /api/mi/sesion` (firma)
Abre "Mi asistencia" desde la app sin hacer check-in. La app pide un reto (`GET /api/checkin/reto`) y lo firma con la huella.
```json
{ "empleadoId": 3, "retoId": 1543, "firma": "<base64>" }
```
Respuesta 200:
```json
{ "tokenEmpleado": "<JWT 8 h>", "empleado": { "id": 3, "nombre": "Isabel Celis" } }
```

### `GET /api/mi/asistencia?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` (empleado)
Sin fechas: últimos 7 días. Un empleado solo puede ver sus propios registros (el id sale del token, no de la URL).
```json
{
  "empleado": { "id": 3, "nombre": "Isabel Celis", "horaEntrada": "08:00", "toleranciaMin": 10 },
  "hoy": { "entrada": "2026-09-29T15:04:05.000Z", "salida": null, "tarde": false },
  "totales": { "diasConAsistencia": 5, "tardanzas": 1 },
  "registros": [
    { "id": 88, "tipo": "entrada", "tarde": false, "registradoEn": "2026-09-29T15:04:05.000Z" }
  ]
}
```

## 5. Pantalla del Roku

### `GET /api/tv/estado?token=<TV_TOKEN>`
Se llama al cargar la página y cada vez que el socket se reconecta.
```json
{
  "fecha": "2026-09-29",
  "totales": { "empleados": 5, "presentes": 3, "tardanzas": 1 },
  "llegaron": [
    { "empleadoId": 3, "nombre": "Isabel Celis", "hora": "2026-09-29T15:04:05.000Z", "tarde": false, "fotoUrl": "/uploads/checkins/88.jpg?token=..." }
  ],
  "faltan": [ { "empleadoId": 5, "nombre": "Jeshua E. Pérez" } ],
  "avisos": [ { "id": 1, "mensaje": "Reunión a las 3 pm" } ],
  "multimedia": [ { "id": 1, "titulo": "Video institucional", "url": "/uploads/multimedia/video1.mp4", "orden": 1 } ]
}
```

## 6. Panel web (JWT de admin o supervisor)

| Método | Ruta | Admin | Supervisor | Descripción |
|---|---|---|---|---|
| GET | `/api/usuarios` | Sí | No | Usuarios del panel |
| POST | `/api/usuarios` | Sí | No | Crear `{ email, password, rol: "admin" \| "supervisor" }` |
| PUT | `/api/usuarios/:id` | Sí | No | Cambiar rol, contraseña o desactivar |
| GET | `/api/empleados` | Sí | Sí | Lista con estado de huella y foto |
| POST | `/api/empleados` | Sí | No | Crear `{ nombre, email, horaEntrada: "08:00", toleranciaMin: 10 }` |
| PUT | `/api/empleados/:id` | Sí | **No** | Editar horario y datos (no activa ni desactiva) |
| DELETE | `/api/empleados/:id` | Sí | No | Desactivar (no se borra el historial) |
| POST | `/api/empleados/:id/codigo` | Sí | No | Código de registro `{ "codigo": "482913", "expiraEn": "..." }` |
| GET | `/api/checkins?fecha=YYYY-MM-DD` | Sí | Sí | Check-ins del día (sin fecha = hoy) |
| GET/POST | `/api/avisos` | Sí | Sí | Listar / crear `{ mensaje, fechaInicio, fechaFin }` |
| PUT/DELETE | `/api/avisos/:id` | Sí | Sí | Editar / desactivar |
| GET/POST | `/api/multimedia` | Sí | Sí | Listar / subir MP4 (multipart `video`, `titulo`, `orden`) |
| PUT/DELETE | `/api/multimedia/:id` | Sí | **No** | Orden / desactivar |
| GET | `/api/reportes/asistencia?desde&hasta&formato=json\|csv` | Sí | Sí | Historial; `formato` solo acepta `json` o `csv` |

Los tres "No" en negritas son decisión del equipo: el supervisor **no** edita empleados
ni toca multimedia, aunque antes esta tabla decía que sí. Se decidió dejar el código
como está, así que la tabla se ajustó para que el contrato no prometa permisos que el
servidor no da. Si un supervisor abre el formulario de edición de un empleado, ve la
pantalla normal pero al guardar recibe `403 SIN_PERMISO`: es lo esperado.

Reglas de los `PUT`:
- Solo se actualizan los campos enviados. Enviar `null` **no** borra un campo.
- `activo` acepta `0`/`1` o `true`/`false`.
- Si el `:id` no existe, los `PUT` y los `DELETE` devuelven `404 NO_ENCONTRADO` (no
  un `200` vacío: antes un id inexistente contestaba "guardado" sin guardar nada).

Validación de empleados (POST `/api/empleados` y PUT `/api/empleados/:id`):
- `nombre`: solo letras (con acentos, ñ y marcas combinadas), espacios simples, apóstrofos (`'`/`’`), guiones y puntos para iniciales (ej. `Jeshua E. Pérez`, `O'Brien`, `J. K. Rowling`, `O. Wilde`). Rechaza dígitos, símbolos, espacios dobles y terminar con punto o guion. Máximo 120 caracteres. Es la misma regla que valida en vivo el panel para no bloquear un nombre que el otro lado acepta.
- `toleranciaMin`: entero de 0 a 20 minutos.

## 7. Eventos Socket.IO

Conexión del dashboard:
```js
io(URL, { auth: { token: TV_TOKEN } })   // el servidor lo mete a la sala "tv"
```

| Evento | Cuándo | Datos |
|---|---|---|
| `nuevo-checkin` | Check-in aceptado | `{ checkinId, empleadoId, nombre, tipo, tarde, hora, fotoUrl, totales }` |
| `nuevo-aviso` | Se crea, edita o desactiva un aviso | `{ avisos: [...] }` (lista completa de avisos activos) |
| `nuevo-multimedia` | Se sube o reordena un video | `{ multimedia: [...] }` (lista completa) |

## 8. face-service (interno, solo lo llama `/server`)

Base: `http://localhost:8000` (no se publica en Nginx).

### `POST /verify` (multipart: `foto_registro`, `selfie`)
```json
{ "verified": true, "distance": 0.31, "threshold": 0.4, "is_real": true, "model": "Facenet512" }
```

### `POST /validar-foto` (multipart: `foto`)
```json
{ "ok": true, "rostros": 1 }
```
