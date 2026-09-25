import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';

// Roles en código (sustituye la tabla "permisos" del PDF). Mayor número = más permisos.
const NIVEL = { supervisor: 1, admin: 2 };

function leerBearer(req) {
  const h = req.headers.authorization ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Panel admin: JWT de 1 h con { id, email, rol }
export function requireRol(rolMinimo = 'supervisor') {
  return (req, _res, next) => {
    const token = leerBearer(req);
    if (!token) return next(errores.noAutenticado());
    try {
      const datos = jwt.verify(token, config.jwtSecret);
      if (datos.tipo !== 'admin') return next(errores.noAutenticado());
      if ((NIVEL[datos.rol] ?? 0) < NIVEL[rolMinimo]) return next(errores.sinPermiso());
      req.usuario = datos;
      next();
    } catch {
      next(errores.noAutenticado());
    }
  };
}

// App móvil durante el registro: token de vinculación de 15 min con { empleadoId }
export function requireVinculacion(req, _res, next) {
  const token = leerBearer(req);
  if (!token) return next(errores.noAutenticado());
  try {
    const datos = jwt.verify(token, config.jwtSecret);
    if (datos.tipo !== 'vinculacion') return next(errores.noAutenticado());
    req.empleadoId = datos.empleadoId;
    next();
  } catch {
    next(errores.noAutenticado('El código de vinculación expiró, pide uno nuevo'));
  }
}

// Pantalla Roku: ?token= en la URL. Se compara contra el SHA-256 guardado.
export async function validarTokenTv(token) {
  if (!token) return null;
  const hash = crypto.createHash('sha256').update(String(token)).digest('hex');
  const filas = await query('SELECT id, nombre FROM dispositivos_tv WHERE token_hash = ? AND activo = 1', [hash]);
  if (!filas.length) return null;
  await query('UPDATE dispositivos_tv SET ultimo_contacto = UTC_TIMESTAMP() WHERE id = ?', [filas[0].id]);
  return filas[0];
}

export async function requireTv(req, _res, next) {
  try {
    const tv = await validarTokenTv(req.query.token);
    if (!tv) return next(errores.noAutenticado());
    req.tv = tv;
    next();
  } catch (e) {
    next(e);
  }
}

// Acceso a fotos: token de TV (?token=) o JWT del panel
export async function requireTvOAdmin(req, res, next) {
  if (leerBearer(req)) return requireRol('supervisor')(req, res, next);
  return requireTv(req, res, next);
}

export function firmarJwt(payload, expiresIn) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}
