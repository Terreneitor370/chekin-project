# Checker · Panel de administración

Frontend de Jorge (Dev 3), construido con React, React Router, Tailwind CSS y Lucide. Solo consume las rutas documentadas en ../docs/api.md; no modifica backend, base de datos ni infraestructura.

## Inicio local

```sh
npm ci
npm run dev
```

Abre http://localhost:5173/admin/login. Usa una cuenta válida de administrador o supervisor de tu backend. No hay usuarios ni datos de demostración incrustados en la aplicación.

El proxy de desarrollo envía /api y /uploads a http://localhost:3000. VITE_API_URL en .env puede definir otro origen (sin /api). El servidor debe permitir el origen del frontend si se usan dominios distintos.

```sh
npm run build
npm run preview
```

La salida dist se publica bajo /admin/. El servidor estático debe devolver index.html para las rutas de la SPA. No se modifica configuración de infraestructura desde este proyecto.

## Módulos

- /login: validación, contraseña visible/oculta, JWT solo en memoria y retorno a la página solicitada. Recargar requiere autenticarse nuevamente. HTTP 401 cierra la sesión.
- /: métricas de asistencia del día, entradas por hora y actividad reciente con datos del servidor.
- /empleados: búsqueda, filtros, paginación, alta, edición de datos y horario, desactivación y vinculación. Código de seis dígitos con vencimiento real y copia al portapapeles.
- /usuarios: alta, cambio de rol/contraseña y desactivación de usuarios, solo para administradores. La cuenta en uso no puede desactivarse desde esta pantalla.
- /avisos: alta, edición, programación en horario de Hermosillo, vista previa del ticker, activación y desactivación.
- /multimedia: subida MP4 multipart, vista previa, orden de reproducción y selección de videos activos. Los supervisores también gestionan multimedia según el contrato.
- /reportes: carga del día actual, rango de fechas y tabla paginada con empleado, fecha y hora, marcaje y verificación facial. Sin columnas de prueba de vida o distancia facial ni exportación CSV.

Modales nativos con foco contenido, Escape, estados de carga, errores reintentables y notificaciones. Diseño adaptable a escritorio y móvil. Las solicitudes de lectura se cancelan al cambiar de ruta y no sobrescriben respuestas posteriores.

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

Pruebas de navegador con respuestas API simuladas exclusivamente en tests/. Cubren acceso, caducidad de sesión, permisos, CRUD, vinculación, avisos, subida multipart, CSV y diseño móvil. Las capturas se guardan en test-results/. PLAYWRIGHT_CHROMIUM_EXECUTABLE permite utilizar un Chromium instalado.

Para confirmar la integración final, ejecutar los mismos recorridos con cuentas y respuestas del backend real. Los mocks solo viven en pruebas y nunca se incluyen en producción.
