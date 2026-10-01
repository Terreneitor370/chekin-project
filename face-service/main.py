"""
face-service: compara la foto de registro con la selfie del check-in usando DeepFace.
Dueño: Jeshua E. Pérez (Dev 4)

- Solo escucha en la red interna (127.0.0.1:8000). Nginx NO lo publica.
- El equipo no maneja vectores: DeepFace.verify() recibe dos imágenes y responde verified.
- Las imágenes se procesan en memoria y no se guardan.

Correr:  uvicorn main:app --host 127.0.0.1 --port 8000
"""
import io
import os
import time

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps

load_dotenv()  # sin esto, FACE_MODEL/FACE_DETECTOR/FACE_ANTI_SPOOFING del .env nunca se leían

MODELO = os.getenv("FACE_MODEL", "Facenet512")
DETECTOR = os.getenv("FACE_DETECTOR", "opencv")
ANTI_SPOOFING = os.getenv("FACE_ANTI_SPOOFING", "true").lower() == "true"
MAX_LADO = int(os.getenv("FACE_MAX_LADO", "1024"))

app = FastAPI(title="face-service", version="0.1.0")
_deepface = None


def deepface():
    """Importa DeepFace una sola vez (tarda varios segundos)."""
    global _deepface
    if _deepface is None:
        from deepface import DeepFace  # noqa: WPS433

        _deepface = DeepFace
    return _deepface


@app.on_event("startup")
def precargar_modelo():
    # Carga el modelo al iniciar para que el primer check-in no tarde de más.
    # La primera vez descarga los pesos (~100-300 MB): hacerlo al instalar, nunca en la demo.
    try:
        deepface().build_model(MODELO)
    except Exception as exc:  # noqa: BLE001
        print(f"[face-service] Aviso: no se pudo precargar {MODELO}: {exc}")


async def leer_imagen(archivo: UploadFile) -> np.ndarray:
    """Lee JPEG/PNG, corrige orientación EXIF, reduce tamaño y devuelve BGR (formato de OpenCV)."""
    datos = await archivo.read()
    try:
        img = Image.open(io.BytesIO(datos))
        img = ImageOps.exif_transpose(img).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="IMAGEN_INVALIDA") from exc
    img.thumbnail((MAX_LADO, MAX_LADO))
    return np.array(img)[:, :, ::-1]


@app.get("/health")
def health():
    return {"ok": True, "model": MODELO, "detector": DETECTOR, "anti_spoofing": ANTI_SPOOFING}


@app.post("/validar-foto")
async def validar_foto(foto: UploadFile = File(...)):
    """Confirma que la foto de registro tenga exactamente un rostro claro."""
    img = await leer_imagen(foto)
    try:
        rostros = deepface().extract_faces(img_path=img, detector_backend=DETECTOR, enforce_detection=True)
    except ValueError:
        raise HTTPException(status_code=422, detail="SIN_ROSTRO")
    total = len(rostros)
    if total != 1:
        raise HTTPException(status_code=422, detail="SIN_ROSTRO")
    return {"ok": True, "rostros": total}


@app.post("/verify")
async def verify(foto_registro: UploadFile = File(...), selfie: UploadFile = File(...)):
    """Compara la foto de registro con la selfie (verificación 1 a 1)."""
    img_registro = await leer_imagen(foto_registro)
    img_selfie = await leer_imagen(selfie)
    inicio = time.perf_counter()

    is_real = None
    if ANTI_SPOOFING:
        try:
            caras = deepface().extract_faces(
                img_path=img_selfie, detector_backend=DETECTOR, anti_spoofing=True, enforce_detection=True
            )
            is_real = all(c.get("is_real", False) for c in caras)
        except ValueError:
            raise HTTPException(status_code=422, detail="SIN_ROSTRO")
        if not is_real:
            return {"verified": False, "distance": None, "threshold": None, "is_real": False, "model": MODELO}

    try:
        r = deepface().verify(
            img1_path=img_registro,
            img2_path=img_selfie,
            model_name=MODELO,
            detector_backend=DETECTOR,
            enforce_detection=True,
        )
    except ValueError:
        raise HTTPException(status_code=422, detail="SIN_ROSTRO")

    return {
        "verified": bool(r["verified"]),
        "distance": round(float(r["distance"]), 4),
        "threshold": float(r["threshold"]),
        "is_real": is_real,
        "model": MODELO,
        "segundos": round(time.perf_counter() - inicio, 2),
    }
