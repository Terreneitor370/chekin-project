# /face-service

**Dueño:** Jeshua E. Pérez (Dev 4)

Servicio interno en Python que compara la **foto de registro** con la **selfie del check-in** usando la librería
[DeepFace](https://github.com/serengil/deepface). El equipo no maneja vectores: `DeepFace.verify()` recibe dos
imágenes y responde si son la misma persona. Incluye detección de fotos falsas (`anti_spoofing`).

Solo lo llama `/server`. **No se publica en Nginx.**

## Correr en local

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
# http://127.0.0.1:8000/health
```

La primera ejecución descarga los pesos del modelo (cientos de MB). Hacerlo al instalar, nunca durante la demo.

## Endpoints

| Método | Ruta | Entrada (multipart) | Respuesta |
|---|---|---|---|
| GET | `/health` | - | `{ ok, model, detector, anti_spoofing }` |
| POST | `/validar-foto` | `foto` | `{ ok, rostros }` o 422 `SIN_ROSTRO` |
| POST | `/verify` | `foto_registro`, `selfie` | `{ verified, distance, threshold, is_real, model }` |

## Configuración (`.env.example`)

- `FACE_MODEL`: empezar con `Facenet512`; probar otro si hay falsos rechazos.
- `FACE_DETECTOR`: `opencv` es rápido; `retinaface` es más preciso pero más lento en CPU.
- `FACE_ANTI_SPOOFING`: `true` para rechazar fotos impresas o mostradas en pantalla.

## Prueba del Día 1

```bash
curl -F foto_registro=@yo1.jpg -F selfie=@yo2.jpg http://127.0.0.1:8000/verify     # verified: true
curl -F foto_registro=@yo1.jpg -F selfie=@otro.jpg http://127.0.0.1:8000/verify    # verified: false
```

## Pendientes (Jeshua)

- [ ] Medir el tiempo por comparación en el VPS (objetivo: menos de 3 s)
- [ ] Probar con fotos impresas y en pantalla (anti_spoofing)
- [ ] Probar con lentes, gorra y poca luz; ajustar modelo o detector si hay falsos rechazos
