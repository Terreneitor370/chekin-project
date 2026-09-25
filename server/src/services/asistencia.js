import { config } from '../config.js';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { esTarde, horaNegocio, rangoDelDia } from '../utils/tiempo.js';

// Reglas del checador (docs/api.md, sección 4):
//  - hora del servidor
//  - primer registro del día = entrada, siguiente = salida
//  - tarde = entrada después de hora_entrada + tolerancia
//  - duplicado = mismo empleado en menos de VENTANA_DUPLICADO_MIN minutos
export async function clasificarRegistro(empleado, ahora = new Date()) {
  const ultimos = await query(
    'SELECT registrado_en FROM checkins WHERE empleado_id = ? ORDER BY registrado_en DESC LIMIT 1',
    [empleado.id],
  );
  if (ultimos.length) {
    const minutos = (ahora - new Date(ultimos[0].registrado_en)) / 60000;
    if (minutos < config.ventanaDuplicadoMin) {
      throw errores.duplicado(horaNegocio(new Date(ultimos[0].registrado_en)).slice(0, 5));
    }
  }
  const { inicio, fin } = rangoDelDia();
  const [{ total }] = await query(
    'SELECT COUNT(*) AS total FROM checkins WHERE empleado_id = ? AND registrado_en >= ? AND registrado_en < ?',
    [empleado.id, inicio, fin],
  );
  const tipo = Number(total) % 2 === 0 ? 'entrada' : 'salida';
  const tarde = tipo === 'entrada' && esTarde(empleado.hora_entrada, empleado.tolerancia_min, ahora);
  return { tipo, tarde };
}
