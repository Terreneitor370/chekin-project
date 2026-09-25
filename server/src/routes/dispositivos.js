import { Router } from 'express';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { firmarJwt } from '../middlewares/auth.js';

const router = Router();

// POST /api/dispositivos/vincular  { codigo }
router.post('/vincular', async (req, res) => {
  const codigo = String(req.body?.codigo ?? '').trim();
  if (!/^\d{6}$/.test(codigo)) throw errores.datosInvalidos('El código debe tener 6 dígitos');
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
