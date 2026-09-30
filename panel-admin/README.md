# Checker · Panel de administración

Frontend de Jorge (Dev 3), construido con React, React Router, Tailwind CSS y Lucide. Solo consume las rutas documentadas en ../docs/api.md; no modifica backend, base de datos ni infraestructura.

## Inicio local

```sh
npm ci
npm run dev
```

Abre http://localhost:5173/admin/login. Usa una cuenta válida de administrador o supervisor de tu backend. El acceso normal utiliza únicamente datos del servidor. Para revisar las pantallas sin base de datos, usa el modo demo explícito descrito abajo.

El proxy de desarrollo envía /api y /uploads a http://localhost:3000. VITE_API_URL en .env puede definir otro origen (sin /api). El servidor debe permitir el origen del frontend si se usan dominios distintos.

```sh
npm run build
npm run preview
```

La salida dist se publica bajo /admin/. El servidor estático debe devolver index.html para las rutas de la SPA. No se modifica configuración de infraestructura desde este proyecto.

## Ver todas las pantallas sin backend

Desde la raíz del proyecto, en una terminal:

```powershell
cd panel-admin
npm run dev
```

Abre **http://localhost:5173/admin/?demo=1**. El modo demo solo está disponible con el servidor local de desarrollo; no se ofrece como acceso desde el login.

- La franja DEMO permanece visible. Puedes recorrer Resumen, Empleados, Avisos, Multimedia, Reportes y Usuarios.
- «Ver login» muestra el formulario; «Entrar a la demo» no solicita credenciales.
- El selector de rol permite revisar administrador y supervisor, según los permisos de docs/api.md.
- Las altas, cambios, códigos de vinculación y CSV son ficticios. Los códigos no vinculan teléfonos reales.
- En Multimedia puedes cargar un MP4 local para revisar la biblioteca y su vista previa. El archivo permanece en el navegador.
- La demo no realiza peticiones a la API ni guarda JWT, contraseñas o datos en almacenamiento persistente. Recargar o «Reiniciar» restaura los ejemplos y elimina los cambios.
- «Salir de la demo» abre el acceso real. La demo del panel y la de TV son independientes; publicar aquí no actualiza ninguna TV.

Para ver directamente una pantalla, conserva `?demo=1`: por ejemplo `/admin/empleados?demo=1` o `/admin/reportes?demo=1`. El modo debe seleccionarse expresamente; un error de conexión nunca activa datos ficticios.

## Módulos

- /login: validación, contraseña visible/oculta, JWT solo en memoria y retorno a la página solicitada. Recargar requiere autenticarse nuevamente. HTTP 401 cierra la sesión.
- /: métricas de asistencia del día, entradas por hora y actividad reciente con datos del servidor.
- /empleados: búsqueda, filtros, paginación, alta, edición de datos y horario, desactivación, reactivación y vinculación. Validación inmediata de nombres (acentos, iniciales y apóstrofos) y tolerancia entera de 0 a 20 minutos. Código de seis dígitos con vencimiento real y copia al portapapeles.
- /usuarios: alta, cambio de rol/contraseña, desactivación y reactivación de usuarios, solo para administradores. La cuenta en uso no puede desactivarse desde esta pantalla.
- /avisos: alta, edición, programación en horario de Hermosillo, vista previa del ticker, activación y desactivación. Los estados Programado / Publicado / Finalizado se actualizan automáticamente al pasar el tiempo.
- /multimedia: subida MP4 multipart, vista previa, orden de reproducción y selección de videos activos. Los supervisores también gestionan multimedia según el contrato.
- /reportes: carga del día actual, rango de fechas y tabla paginada con empleado, fecha y hora, marcaje y verificación facial. Descarga CSV desde el endpoint documentado, con JWT y el rango consultado (no fechas aún sin aplicar). Se conserva el contenido del servidor y se agrega BOM UTF-8 para los acentos en Excel; el archivo se llama checker_asistencia_DESDE_HASTA.csv. No se agregaron columnas de prueba de vida o distancia facial a la tabla.

Modales nativos con foco contenido, Escape, estados de carga, errores reintentables y notificaciones. Diseño adaptable a escritorio y móvil. Las solicitudes de lectura se cancelan al cambiar de ruta y no sobrescriben respuestas posteriores. Tiempo máximo de espera: 20 segundos para solicitudes normales y 120 segundos para subidas. Un guardado sin respuesta libera el modal y pide consultar la lista antes de repetirlo; no se reintentan mutaciones automáticamente.

## Integración y límites conocidos

El contrato define las rutas administrativas, pero no especifica ejemplos completos de sus respuestas GET. Se mantiene la forma que usaba la base del frontend: listas de objetos con nombres camelCase (nombre, horaEntrada, toleranciaMin, tieneHuella, tieneFoto, registradoEn, verificado, esReal, distancia). El adaptador también admite listas envueltas en empleados, usuarios, avisos, multimedia, checkins o registros. Una respuesta inesperada muestra un error, no una tabla silenciosamente vacía.

Los avatares usan iniciales: el contrato no documenta una URL de foto de empleado accesible mediante JWT para el panel. No se inventan endpoints de recuperación de contraseña, banners, fotos o puestos. La biblioteca admite MP4, que es el formato documentado.

El servidor realiza la emisión de eventos a la TV tras guardar avisos o multimedia. El panel no necesita usar el token de TV. La reordenación usa PUT secuenciales porque no hay endpoint transaccional de lista; ante un fallo recarga el orden real y muestra el error.

Las fechas de avisos usan America/Hermosillo (UTC−07:00). Si se edita una programación existente no puede borrarse con null según el contrato; puede modificarse o pausarse el aviso.

## Pruebas

```sh
npx playwright install chromium
npm test
```

Pruebas de navegador con respuestas API simuladas en tests/ y recorridos del modo demo aislado. Cubren acceso, caducidad de sesión, permisos, CRUD, reactivación, nombres y tolerancia, vinculación, programación de avisos, subida multipart, descarga CSV autenticada, recuperación de solicitudes bloqueadas, demo sin API y diseño móvil. Las capturas se guardan en test-results/. PLAYWRIGHT_CHROMIUM_EXECUTABLE permite utilizar un Chromium instalado.

Para confirmar la integración final, ejecutar los mismos recorridos con cuentas y respuestas del backend real. Las pruebas simuladas no sustituyen la validación con el backend real. El modo demo solo se habilita durante desarrollo local y nunca sirve como autenticación del servidor.
