import mysql from 'mysql2/promise';
import { config } from './config.js';

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

export async function dbDisponible() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
