import { Router } from 'express';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { validar } from '../middlewares/validar.js';
import { requireEmpleado } from '../middlewares/auth.js';
import { miSesion, miAsistencia } from '../validacion.js';
import { consumirReto, verificarFirmaConHuella, firmarTokenEmpleado } from '../services/sesionEmpleado.js';
import { fechaNegocio, rangoDelDia, restarDias } from '../utils/tiempo.js';

const router = Router();

// POST /api/mi/sesion  { empleadoId, retoId, firma }
// Abre "Mi asistencia" con la huella, sin registrar check-in y sin pasar por
// DeepFace: aquí no se compara ningún rostro, solo se prueba que la firma salió
// de la llave que el empleado registró en ESTE celular.
router.post('/sesion', validar(miSesion), async (req, res) => {
  const { empleadoId, retoId, firma } = req.body;

  const [empleado] = await query(
    'SELECT id, nombre, hora_entrada, tolerancia_min FROM empleados WHERE id = ? AND activo = 1',
    [empleadoId],
  );
  if (!empleado) throw errores.noEncontrado('Empleado no encontrado');

  const valorReto = await consumirReto({ retoId, empleadoId });
  await verificarFirmaConHuella({ empleadoId, payload: valorReto, firma });

  res.json({
    tokenEmpleado: firmarTokenEmpleado(empleado.id),
    empleado: { id: empleado.id, nombre: empleado.nombre },
  });
});

// GET /api/mi/asistencia?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Sin fechas: últimos 7 días. El empleado sale del token, no de la URL, para que
// uno no pueda ver el registro de otro.
router.get('/asistencia', requireEmpleado, validar(miAsistencia, 'query'), async (req, res) => {
  const empleadoId = req.empleadoId;

  // Si le desactivan la cuenta o lo dan de baja, el token de 8 h deja de servir
  // de inmediato: aquí se revisa, no solo al firmar.
  const [empleado] = await query(
    'SELECT id, nombre, hora_entrada, tolerancia_min FROM empleados WHERE id = ? AND activo = 1',
    [empleadoId],
  );
  if (!empleado) throw errores.noAutenticado('Tu cuenta ya no está activa');

  const hoy = fechaNegocio();
  const { desde, hasta } = rangoPedido(req.query, hoy);
  const { inicio, fin } = rangoDelDia(desde);
  const finHasta = rangoDelDia(hasta).fin;

  // Ojo: query() devuelve el arreglo de filas, no [filas, campos] como pool.execute.
  const filas = await query(
    `SELECT id, tipo, tarde, registrado_en
       FROM checkins
      WHERE empleado_id = ? AND registrado_en >= ? AND registrado_en < ?
      ORDER BY registrado_en ASC`,
    [empleadoId, inicio, finHasta],
  );

  // Los totales se cuentan en JS y no en SQL a propósito: "día" es el día de
  // negocio de America/Hermosillo, no la fecha UTC de MySQL. Así el mismo
  // criterio que usa el resto del sistema.
  const dias = new Set();
  let tardanzas = 0;
  for (const f of filas) {
    dias.add(fechaNegocio(new Date(f.registrado_en)));
    if (f.tarde) tardanzas++;
  }

  const registrosHoy = filas.filter((f) => fechaNegocio(new Date(f.registrado_en)) === hoy);
  const entradas = registrosHoy.filter((f) => f.tipo === 'entrada');
  const salidas = registrosHoy.filter((f) => f.tipo === 'salida');

  res.json({
    empleado: {
      id: empleado.id,
      nombre: empleado.nombre,
      // MySQL devuelve TIME como "08:00:00"; el contrato dice "08:00".
      horaEntrada: String(empleado.hora_entrada).slice(0, 5),
      toleranciaMin: empleado.tolerancia_min,
    },
    hoy: {
      entrada: entradas.length ? new Date(entradas[0].registrado_en) : null,
      salida: salidas.length ? new Date(salidas[salidas.length - 1].registrado_en) : null,
      tarde: entradas.length ? Boolean(entradas[0].tarde) : false,
    },
    totales: { diasConAsistencia: dias.size, tardanzas },
    rango: { desde, hasta },
    registros: filas.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      tarde: Boolean(f.tarde),
      registradoEn: new Date(f.registrado_en),
    })),
  });
});

// Últimos 7 días por defecto (hoy incluido). Si viene solo un borde, el otro se
// rellena 7 días: así "?desde=2026-09-01" llega hasta hoy y "?hasta=2026-09-01"
// trae esa semana, en vez de un rango de un solo día que nadie pidió.
function rangoPedido(q, hoy) {
  const hasta = q.hasta ?? hoy;
  return { desde: q.desde ?? restarDias(hasta, 6), hasta };
}

export default router;
