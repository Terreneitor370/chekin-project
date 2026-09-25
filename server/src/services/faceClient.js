import { config } from '../config.js';
import { errores } from '../utils/errores.js';

// Cliente del face-service (Python + DeepFace). Solo existe en la red interna.
async function enviar(ruta, archivos, timeoutMs = 30000) {
  const form = new FormData();
  for (const [campo, buffer] of Object.entries(archivos)) {
    form.append(campo, new Blob([buffer], { type: 'image/jpeg' }), `${campo}.jpg`);
  }
  let resp;
  try {
    resp = await fetch(`${config.faceServiceUrl}${ruta}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw errores.faceNoDisponible();
  }
  const datos = await resp.json().catch(() => ({}));
  if (resp.status === 422) throw errores.sinRostro();
  if (!resp.ok) throw errores.faceNoDisponible();
  return datos;
}

// { verified, distance, threshold, is_real, model }
export function verificarRostro(fotoRegistro, selfie) {
  return enviar('/verify', { foto_registro: fotoRegistro, selfie });
}

// { ok, rostros }
export function validarFoto(foto) {
  return enviar('/validar-foto', { foto });
}

export async function faceDisponible() {
  try {
    const r = await fetch(`${config.faceServiceUrl}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}
