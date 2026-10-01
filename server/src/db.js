import mysql from 'mysql2/promise';
import { config } from './config.js';
import { errores } from './utils/errores.js';

// Un solo acceso a datos: mysql2 con consultas parametrizadas (nunca concatenar SQL).
export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z', // fechas en UTC
  dateStrings: false,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// UPDATE/DELETE contra un id: si el WHERE no alcanza ninguna fila, el id no existe y
// la ruta tiene que decir 404, no devolver un ok vacio. Sin esto, PUT /api/usuarios/99
// respondia 200 con {ok:true} y el panel mostraba "guardado" sin guardar nada.
//
// Se apoya en que mysql2 devuelve affectedRows como filas ENCONTRADAS, no
// modificadas (comprobado: un UPDATE que deja el valor igual sigue dando 1), asi que
// volver a desactivar algo ya desactivado da 200 y no un 404 falso.
export async function modificar(sql, params, mensaje = 'No encontrado') {
  const r = await query(sql, params);
  if (r.affectedRows === 0) throw errores.noEncontrado(mensaje);
  return r;
}

export async function dbDisponible() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
