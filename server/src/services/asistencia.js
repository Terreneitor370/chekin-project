import { config } from '../config.js';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { esTarde, horaNegocio, rangoDelDia } from '../utils/tiempo.js';

// Reglas del checador (docs/api.md, sección 4):
//  - hora del servidor
//  - el empleado elige entrada o salida; cada una se puede marcar una sola vez al día
//  - salida exige haber marcado entrada ese mismo día
//  - tarde = entrada después de hora_entrada + tolerancia
//  - duplicado = mismo empleado en menos de VENTANA_DUPLICADO_MIN minutos (de cualquier tipo)
export async function clasificarRegistro(empleado, tipo, ahora = new Date()) {
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
  const deHoy = await query(
    'SELECT tipo FROM checkins WHERE empleado_id = ? AND registrado_en >= ? AND registrado_en < ?',
    [empleado.id, inicio, fin],
  );
  if (tipo === 'salida' && !deHoy.some((c) => c.tipo === 'entrada')) throw errores.sinEntrada();
  if (deHoy.some((c) => c.tipo === tipo)) throw errores.yaRegistrado(tipo);
  const tarde = tipo === 'entrada' && esTarde(empleado.hora_entrada, empleado.tolerancia_min, ahora);
  return { tipo, tarde };
}
