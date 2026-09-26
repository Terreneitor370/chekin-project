import { Router } from 'express';
import { query } from '../db.js';
import { requireRol } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import { avisosActivos } from '../services/estadoTv.js';
import { emitirTv, EVENTOS } from '../services/eventos.js';
import {
  actualizarAviso as esquemaActualizarAviso,
  crearAviso as esquemaCrearAviso,
  idParam,
} from '../validacion.js';

const router = Router();
router.use(requireRol('supervisor'));

async function notificarTv() {
  emitirTv(EVENTOS.NUEVO_AVISO, { avisos: await avisosActivos() });
}

router.get('/', async (_req, res) => {
  res.json(await query('SELECT id, mensaje, activo, fecha_inicio AS fechaInicio, fecha_fin AS fechaFin FROM avisos ORDER BY id DESC'));
});

router.post('/', validar(esquemaCrearAviso), async (req, res) => {
  const { mensaje, fechaInicio = null, fechaFin = null } = req.body;
  const r = await query(
    'INSERT INTO avisos (mensaje, fecha_inicio, fecha_fin, creado_por) VALUES (?, ?, ?, ?)',
    [mensaje, fechaInicio, fechaFin, req.usuario.id],
  );
  await notificarTv();
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', validar(idParam, 'params'), validar(esquemaActualizarAviso), async (req, res) => {
  const { mensaje, activo, fechaInicio, fechaFin } = req.body;
  await query(
    `UPDATE avisos SET mensaje = COALESCE(?, mensaje), activo = COALESCE(?, activo),
       fecha_inicio = COALESCE(?, fecha_inicio), fecha_fin = COALESCE(?, fecha_fin) WHERE id = ?`,
    [mensaje ?? null, activo === undefined ? null : (activo ? 1 : 0), fechaInicio ?? null, fechaFin ?? null, req.params.id],
  );
  await notificarTv();
  res.json({ ok: true });
});

router.delete('/:id', validar(idParam, 'params'), async (req, res) => {
  await query('UPDATE avisos SET activo = 0 WHERE id = ?', [req.params.id]);
  await notificarTv();
  res.json({ ok: true });
});

export default router;
