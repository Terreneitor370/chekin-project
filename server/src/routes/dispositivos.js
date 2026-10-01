import { Router } from 'express';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { firmarJwt } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import { vincular as esquemaVincular } from '../validacion.js';

const router = Router();

// POST /api/dispositivos/vincular  { codigo }
router.post('/vincular', validar(esquemaVincular), async (req, res) => {
  const { codigo } = req.body;
  const [fila] = await query(
    `SELECT c.id, c.empleado_id, e.nombre
     FROM codigos_vinculacion c JOIN empleados e ON e.id = c.empleado_id
     WHERE c.codigo = ? AND c.usado_en IS NULL AND c.expira_en > UTC_TIMESTAMP() AND e.activo = 1
     ORDER BY c.id DESC LIMIT 1`,
    [codigo],
  );
  if (!fila) throw errores.noAutenticado('Código inválido o expirado');
  await query('UPDATE codigos_vinculacion SET usado_en = UTC_TIMESTAMP() WHERE id = ?', [fila.id]);
  const tokenVinculacion = firmarJwt({ tipo: 'vinculacion', empleadoId: fila.empleado_id }, '15m');
  res.json({ tokenVinculacion, empleado: { id: fila.empleado_id, nombre: fila.nombre } });
});

export default router;
