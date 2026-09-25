import { Router } from 'express';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { requireRol } from '../middlewares/auth.js';
import { avisosActivos } from '../services/estadoTv.js';
import { emitirTv, EVENTOS } from '../services/eventos.js';

const router = Router();
router.use(requireRol('supervisor'));

async function notificarTv() {
  emitirTv(EVENTOS.NUEVO_AVISO, { avisos: await avisosActivos() });
}

router.get('/', async (_req, res) => {
  res.json(await query('SELECT id, mensaje, activo, fecha_inicio AS fechaInicio, fecha_fin AS fechaFin FROM avisos ORDER BY id DESC'));
});

router.post('/', async (req, res) => {
  const { mensaje, fechaInicio = null, fechaFin = null } = req.body ?? {};
  if (!mensaje) throw errores.datosInvalidos('El mensaje es obligatorio');
  const r = await query(
    'INSERT INTO avisos (mensaje, fecha_inicio, fecha_fin, creado_por) VALUES (?, ?, ?, ?)',
    [String(mensaje).slice(0, 255), fechaInicio, fechaFin, req.usuario.id],
  );
  await notificarTv();
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', async (req, res) => {
  const { mensaje, activo, fechaInicio, fechaFin } = req.body ?? {};
  await query(
    `UPDATE avisos SET mensaje = COALESCE(?, mensaje), activo = COALESCE(?, activo),
       fecha_inicio = COALESCE(?, fecha_inicio), fecha_fin = COALESCE(?, fecha_fin) WHERE id = ?`,
    [mensaje ?? null, activo ?? null, fechaInicio ?? null, fechaFin ?? null, req.params.id],
  );
  await notificarTv();
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await query('UPDATE avisos SET activo = 0 WHERE id = ?', [req.params.id]);
  await notificarTv();
  res.json({ ok: true });
});

export default router;
