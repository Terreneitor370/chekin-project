import { AppError } from '../utils/errores.js';

export function noEncontrado(_req, res) {
  res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada' } });
}

// Todas las respuestas de error siguen el contrato de docs/api.md
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message } });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: { codigo: 'DATOS_INVALIDOS', mensaje: 'El archivo es demasiado grande' } });
  }
  if (err?.status === 400 || err?.statusCode === 400) {
    return res.status(400).json({ error: { codigo: 'DATOS_INVALIDOS', mensaje: 'El cuerpo de la solicitud no es válido' } });
  }
  console.error(err);
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' } });
}
