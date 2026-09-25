# /dashboard-tv

**Dueño:** Jorge Ramírez (Dev 3)

App web que se abre en el **navegador del Roku** (Opción A del profe): modo multimedia y modo checador en tiempo real.
Se hizo con React + Vite (sin librerías pesadas) porque los navegadores del Roku tienen poca memoria.

## Correr en local

```bash
npm install
npm run dev
# Abrir: http://localhost:5174/tv/?token=tv-demo-token-cambiar
```

En producción Nginx la sirve en `https://<dominio>/tv/?token=<TV_TOKEN>`; esa es la URL que se abre en el Roku.

## Estructura

```
src/
  App.jsx                   decide el modo visible
  config.js                 token de la URL, tiempos, URL del API
  hooks/useEstadoTv.js      GET /api/tv/estado + Socket.IO (nuevo-checkin, nuevo-aviso, nuevo-multimedia)
  hooks/useModoPantalla.js  cola: anuncio 4 s por persona -> resumen 15 s -> multimedia (con useRef)
  components/
    ModoMultimedia.jsx      video muted en loop, reloj, contador, ticker
    ModoAnuncio.jsx         foto + nombre + hora
    ModoResumen.jsx         llegaron / faltan / tarde
    Reloj.jsx, Ticker.jsx, Contador.jsx
  styles.css                1920x1080, fuentes grandes, márgenes de 5%
```

## Reglas para el Roku

- Nada de interacción: todo es automático.
- Video siempre `muted` (si no, el navegador bloquea el autoplay).
- Al reconectar se vuelve a pedir el estado del día (sobrevive a reinicios y cortes).
- Probar el Día 1 en el navegador del Roku; si no carga bien, contingencia: duplicar pantalla desde laptop.

## Pendientes (Jorge)

- [ ] Probar en el navegador del Roku real (video, fotos, Socket.IO)
- [ ] Ajustar tamaños y colores en la TV real
