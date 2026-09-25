import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../config.js';

// Carpetas dentro de server/uploads:
//  - registro/   fotos de referencia (privadas, solo las lee el servidor)
//  - checkins/   selfies de cada check-in (TV con token o admin)
//  - multimedia/ videos del modo multimedia
export async function guardarArchivo(subcarpeta, buffer, extension = 'jpg') {
  const dir = path.join(config.uploadsDir, subcarpeta);
  await fs.mkdir(dir, { recursive: true });
  const nombre = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(dir, nombre), buffer);
  return `${subcarpeta}/${nombre}`; // ruta relativa que se guarda en la BD
}

export function leerArchivo(rutaRelativa) {
  return fs.readFile(path.join(config.uploadsDir, rutaRelativa));
}

export function rutaAbsoluta(rutaRelativa) {
  return path.join(config.uploadsDir, rutaRelativa);
}
