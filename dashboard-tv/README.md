# Dashboard TV · Checker

Aplicación de Jorge (Dev 3). React, Vite, Tailwind CSS, Socket.IO y Lucide. Todos los cambios viven en dashboard-tv. Contrato de integración: ../docs/api.md.

## Ejecutar

```sh
npm ci
npm run dev
```

Abrir http://localhost:5174/tv/?token=<TV_TOKEN> con un token válido del servidor. Vite conecta /api, /uploads y /socket.io a localhost:3000. Sin backend se muestra Reconectando; sin token, Pantalla sin vincular. El acceso normal nunca sustituye errores de conexión por datos ficticios.

VITE_API_URL, opcional en .env, es el origen del servidor (sin /api). Vacío usa el mismo origen de la página. El token procede de la URL, no se guarda en localStorage ni se agrega a dominios externos.

```sh
npm run build
npm run preview
```

Publicar dist bajo /tv/. El servidor debe permitir Socket.IO y servir archivos multimedia. El frontend no modifica infraestructura.

## Ver pantallas sin backend ni token

En otra terminal, desde la raíz del proyecto:

```powershell
cd dashboard-tv
npm run dev
```

Abre **http://localhost:5174/tv/?demo=1**.

La barra DEMO permite ver Entrada, Tardanza, Salida, una ráfaga de tres personas, Resumen, Multimedia y Reconexión. «Restablecer» simula recuperar la conexión. Hay 18 personas ficticias en el resumen para comprobar las cuatro páginas. «Video local» reproduce un MP4 del equipo sin subirlo a un servidor. Recargar restablece los ejemplos.

La demo no consulta la API ni abre Socket.IO. Sus datos son independientes de la demo del panel. Solo está disponible con el servidor local de desarrollo y no se incluye en la compilación de producción. «Salir» vuelve a la pantalla normal, que requiere un token real.

## Comportamiento

- 1080p, safe area del 5%, texto mínimo de 32 px a resolución nativa, sin scroll. Fuentes del sistema sin descargas externas. La composición se escala proporcionalmente también en 720p y ventanas intermedias, conservando el formato 16:9.
- Videos ordenados, autoplay, muted y playsInline. Uno se repite; varios rotan. Se pausa durante registros y resúmenes. Videos fallidos se omiten y vuelven a intentarse después de 30 segundos mientras multimedia esté visible y el socket conectado, además de al reconectar o cambiar la lista. Sin contenido aparece una composición institucional en CSS.
- nuevo-checkin: cola FIFO, cuatro segundos por persona, deduplicación con ventana de 1.000 IDs. Foto con alternativa de iniciales. Entrada, salida y tardanza diferenciadas.
- Tras la cola: resumen de al menos quince segundos, páginas automáticas de cinco filas cada cinco segundos y regreso a multimedia. La duración aumenta a cinco segundos por página cuando hay más de quince personas en cualquiera de las columnas, para mostrar a todas. Se usa una captura de la lista al comenzar el resumen. Un nuevo registro interrumpe el resumen.
- Reloj America/Hermosillo y avisos persistentes. nuevo-aviso y nuevo-multimedia reemplazan las listas.
- Estado al iniciar y reconectar; reintentos HTTP, timeout, cancelación y actualización al cambiar el día. Eventos recibidos durante una consulta se reaplican.
- Temporizadores en useRef con limpieza al desmontar. Un solo reproductor de video.

## Límites del contrato

nuevo-checkin incluye fotoUrl, pero no garantiza foto de perfil ni incluye puesto. Se muestra la foto recibida y el puesto solo si llega ese campo. Multimedia admite MP4; no se inventan endpoints de banners.

## Validación

```sh
npx playwright install chromium
npm test
```

Las pruebas usan un servidor simulado en memoria en el puerto 3000 (debe estar libre). No utilizan ni modifican /server. Cubren 1080p, fuentes, safe area, diez registros consecutivos, deduplicación, duración de anuncios, resumen, ticker, reconexión, reintentos HTTP, token ausente, reintento de medios fallidos, resumen de más de quince personas, escalado en 720p/900p y demo sin API ni sockets. Capturas en test-results/.

PLAYWRIGHT_CHROMIUM_EXECUTABLE permite usar un Chromium instalado. Playwright y Socket.IO server son dependencias de desarrollo y no forman parte del bundle.

Pendiente: probar en Roku físico reproducción MP4, Socket.IO, memoria y lectura a distancia. El PDF propone duplicar pantalla desde Windows si el canal no es compatible. ES2017 no garantiza compatibilidad con todos los canales de navegador del Roku.
