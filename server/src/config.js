import 'dotenv/config';
import { fileURLToPath } from 'node:url';

function requerido(nombre) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (revisa server/.env)`);
  return valor;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  env: process.env.NODE_ENV ?? 'development',
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: requerido('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'checador',
  },
  jwtSecret: requerido('JWT_SECRET'),
  faceServiceUrl: process.env.FACE_SERVICE_URL ?? 'http://127.0.0.1:8000',
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  tzNegocio: process.env.TZ_NEGOCIO ?? 'America/Hermosillo',
  ventanaDuplicadoMin: Number(process.env.VENTANA_DUPLICADO_MIN ?? 5),
  uploadsDir: fileURLToPath(new URL('../uploads/', import.meta.url)),
};
