# Dashboard TV · Checker

Aplicación de Jorge (Dev 3). React, Vite, Tailwind CSS, Socket.IO y Lucide. Todos los cambios viven en dashboard-tv. Contrato de integración: ../docs/api.md.

## Ejecutar

```sh
npm ci
npm run dev
```

Abrir http://localhost:5174/tv/?token=<TV_TOKEN> con un token válido del servidor. Vite conecta /api, /uploads y /socket.io a localhost:3000. Sin backend se muestra Reconectando; sin token, Pantalla sin vincular. No se muestran datos ficticios en producción.

VITE_API_URL, opcional en .env, es el origen del servidor (sin /api). Vacío usa el mismo origen de la página. El token procede de la URL, no se guarda en localStorage ni se agrega a dominios externos.

```sh
npm run build
npm run preview
```

Publicar dist bajo /tv/. El servidor debe permitir Socket.IO y servir archivos multimedia. El frontend no modifica infraestructura.

## Comportamiento

- 1080p, safe area del 5%, texto mínimo de 32 px a resolución nativa, sin scroll. Fuentes del sistema sin descargas externas.
- Videos ordenados, autoplay, muted y playsInline. Uno se repite; varios rotan. Se pausa durante registros y resúmenes. Videos fallidos se omiten hasta que cambie la lista. Sin contenido aparece una composición institucional en CSS.
- nuevo-checkin: cola FIFO, cuatro segundos por persona, deduplicación con ventana de 1.000 IDs. Foto con alternativa de iniciales. Entrada, salida y tardanza diferenciadas.
- Tras la cola: resumen de quince segundos, páginas automáticas de cinco filas y regreso a multimedia. Un nuevo registro interrumpe el resumen.
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

Las pruebas usan un servidor simulado en memoria en el puerto 3000 (debe estar libre). No utilizan ni modifican /server. Cubren 1080p, fuentes, safe area, diez registros consecutivos, deduplicación, duración de anuncios, resumen, ticker, reconexión, reintentos HTTP, token ausente y medios fallidos. Capturas en test-results/.

PLAYWRIGHT_CHROMIUM_EXECUTABLE permite usar un Chromium instalado. Playwright y Socket.IO server son dependencias de desarrollo y no forman parte del bundle.

Pendiente: probar en Roku físico reproducción MP4, Socket.IO, memoria y lectura a distancia. El PDF propone duplicar pantalla desde Windows si el canal no es compatible. ES2017 no garantiza compatibilidad con todos los canales de navegador del Roku.
