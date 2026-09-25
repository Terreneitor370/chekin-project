# Plan de 7 días

| Día | Isabel (mobile) | Kassandra (server) | Jorge (TV + panel) | Jeshua (datos, infra, face) |
|---|---|---|---|---|
| 1 | Development build en el Oppo; pantalla "Pruebas del Día 1" | `npm run probar-firma` con la llave y firma del Oppo | Dashboard abierto en el navegador del Roku | DeepFace con 2 fotos; VPS con HTTPS |
| 2 | Vinculación, registro de huella y foto | Probar endpoints con Postman contra la BD real | Modo multimedia en la TV real | face-service en el VPS; pesos del modelo descargados |
| 3 | Check-in completo contra la nube | Ajustes al flujo de check-in | Modo checador con datos reales | **Prueba integral: celular - nube - DeepFace - Roku** |
| 4 | Mensajes de error por código | Tardanzas, duplicados, reportes | Cola de anuncios; panel: empleados y avisos | anti_spoofing; ajustar modelo/detector |
| 5 | Pruebas en 2-3 teléfonos; apoyo al panel | Validaciones y rate limit | Panel: multimedia y reportes | Pruebas E2E; backup y restauración |
| 6 | Corrección de errores | Corrección de errores | Ajustes en la TV real | Ensayo de demo x2; video de respaldo |
| 7 | Demo | Demo | Demo | Demo |

## Punto de control del Día 1

1. Firma con huella en el Oppo Reno 14 (Isabel).
2. Esa firma validada en el servidor con `npm run probar-firma` (Kassandra).
3. DeepFace comparando dos fotos (Jeshua).
4. El dashboard abierto en el navegador del Roku (Jorge).

## Pruebas E2E (PDF + nuevas)

| # | Prueba | Esperado |
|---|---|---|
| 1 | 10 check-ins seguidos | Sin duplicados; la TV anuncia a todos |
| 2 | Cortar internet del celular | Mensaje claro y reintento |
| 3 | Reiniciar la TV | Recupera los check-ins del día |
| 4 | Cortar el backend 30 s | "Reconectando..." y recuperación sola |
| 5 | Check-in duplicado en menos de 5 min | 409 DUPLICADO |
| 6 | Foto corrupta | 400 IMAGEN_INVALIDA |
| 7 | 50 check-ins en 1 min | 429 |
| 8 | Compañero con el celular de otro | 403 ROSTRO_NO_COINCIDE |
| 9 | Foto impresa o en pantalla | 403 ROSTRO_NO_REAL |
| 10 | Reto reutilizado o firma alterada | 401 |
| 11 | Foto de registro sin rostro | 422 SIN_ROSTRO |
| 12 | Abrir /tv sin token | No muestra datos |

`server/scripts/simular-flujo.js` recorre el flujo completo sin teléfono (útil para pruebas 5, 8 y 11).
