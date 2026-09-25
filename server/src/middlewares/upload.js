import multer from 'multer';
import { errores } from '../utils/errores.js';

// Imágenes en memoria (máx. 3 MB). Se validan por "magic bytes", no por la extensión.
export const subirImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

// Videos MP4 (máx. 200 MB). Revisar client_max_body_size en Nginx.
export const subirVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

export function esJpegOPng(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  return jpeg || png;
}

export function exigirImagen(campo) {
  return (req, _res, next) => {
    const archivo = req.file;
    if (!archivo) return next(errores.datosInvalidos(`Falta el archivo "${campo}"`));
    if (!esJpegOPng(archivo.buffer)) return next(errores.imagenInvalida());
    next();
  };
}
