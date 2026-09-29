import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { verificarFirma } from './firma.js';
import { firmarJwt } from '../middlewares/auth.js';

// Lo que comparten POST /api/checkin y POST /api/mi/sesion: los dos abren sesión
// con la huella (reto de un solo uso + firma RSA), así que la comprobación vive
// aquí para que no se desincronicen. El check-in además pasa por DeepFace;
// abrir "Mi asistencia" no, porque solo prueba que es tu celular.

// El reto se gasta en cuanto el servidor lo recibe (docs/api.md), y el UPDATE
// lleva todas las condiciones: debe ser de este empleado, no usado y no vencido.
export async function consumirReto({ retoId, empleadoId }) {
  const marcado = await query(
    'UPDATE retos SET usado = 1 WHERE id = ? AND empleado_id = ? AND usado = 0 AND expira_en > UTC_TIMESTAMP()',
    [retoId, empleadoId],
  );
  if (marcado.affectedRows !== 1) throw errores.retoInvalido();
  const [reto] = await query('SELECT valor FROM retos WHERE id = ?', [retoId]);
  return reto.valor;
}

// La huella activa del empleado. Si no tiene ninguna, la firma no se puede validar
// y sale FIRMA_INVALIDA, no un 500.
export async function verificarFirmaConHuella({ empleadoId, payload, firma }) {
  const [huella] = await query(
    'SELECT id, llave_publica FROM huellas WHERE empleado_id = ? AND activa = 1 ORDER BY id DESC LIMIT 1',
    [empleadoId],
  );
  if (!huella || !verificarFirma({ llavePublica: huella.llave_publica, payload, firma })) {
    throw errores.firmaInvalida();
  }
  return huella;
}

// JWT de 8 h que solo vale para /api/mi/... (docs/api.md, sección 4.1). Lleva
// tipo: 'empleado' para que requireRol() del panel lo rechace, y para que el
// requireEmpleado() de /api/mi rechace los tokens de admin/supervisor.
// Recibe el id y no el objeto de la fila a propósito: en checkins la columna
// viene como empleadoId y en empleados como id, y pasarlos mal se traducía en
// un token con empleadoId undefined.
export function firmarTokenEmpleado(empleadoId) {
  return firmarJwt({ tipo: 'empleado', empleadoId }, '8h');
}
