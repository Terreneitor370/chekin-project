import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { requireRol, requireVinculacion } from '../middlewares/auth.js';
import { subirImagen, exigirImagen } from '../middlewares/upload.js';
import { validarFoto } from '../services/faceClient.js';
import { guardarArchivo } from '../services/archivos.js';

const router = Router();

// POST /api/empleados/foto-registro  (app móvil con token de vinculación)
router.post('/foto-registro', requireVinculacion, subirImagen.single('foto'), exigirImagen('foto'), async (req, res) => {
  const resultado = await validarFoto(req.file.buffer);
  if (!resultado.ok || resultado.rostros !== 1) throw errores.sinRostro();
  const ruta = await guardarArchivo('registro', req.file.buffer);
  await query('UPDATE empleados SET foto_registro_path = ? WHERE id = ?', [ruta, req.empleadoId]);
  res.status(201).json({ ok: true });
});

// GET /api/empleados
router.get('/', requireRol('supervisor'), async (_req, res) => {
  const filas = await query(
    `SELECT e.id, e.nombre, e.email, TIME_FORMAT(e.hora_entrada, '%H:%i') AS horaEntrada,
            e.tolerancia_min AS toleranciaMin, e.activo,
            e.foto_registro_path IS NOT NULL AS tieneFoto,
            EXISTS (SELECT 1 FROM huellas h WHERE h.empleado_id = e.id AND h.activa = 1) AS tieneHuella
     FROM empleados e ORDER BY e.nombre`,
  );
  res.json(filas);
});

// POST /api/empleados
router.post('/', requireRol('admin'), async (req, res) => {
  const { nombre, email = null, horaEntrada = '08:00', toleranciaMin = 10 } = req.body ?? {};
  if (!nombre) throw errores.datosInvalidos('El nombre es obligatorio');
  const r = await query(
    'INSERT INTO empleados (nombre, email, hora_entrada, tolerancia_min) VALUES (?, ?, ?, ?)',
    [nombre, email, horaEntrada, toleranciaMin],
  );
  res.status(201).json({ id: r.insertId });
});

// PUT /api/empleados/:id
router.put('/:id', requireRol('admin'), async (req, res) => {
  const { nombre, email, horaEntrada, toleranciaMin, activo } = req.body ?? {};
  await query(
    `UPDATE empleados SET
       nombre = COALESCE(?, nombre), email = COALESCE(?, email),
       hora_entrada = COALESCE(?, hora_entrada), tolerancia_min = COALESCE(?, tolerancia_min),
       activo = COALESCE(?, activo)
     WHERE id = ?`,
    [nombre ?? null, email ?? null, horaEntrada ?? null, toleranciaMin ?? null, activo ?? null, req.params.id],
  );
  res.json({ ok: true });
});

// DELETE /api/empleados/:id  (desactiva, conserva historial)
router.delete('/:id', requireRol('admin'), async (req, res) => {
  await query('UPDATE empleados SET activo = 0 WHERE id = ?', [req.params.id]);
  await query('UPDATE huellas SET activa = 0 WHERE empleado_id = ?', [req.params.id]);
  res.json({ ok: true });
});

// POST /api/empleados/:id/codigo  (código de vinculación de 6 dígitos, 15 min)
router.post('/:id/codigo', requireRol('admin'), async (req, res) => {
  const [empleado] = await query('SELECT id FROM empleados WHERE id = ? AND activo = 1', [req.params.id]);
  if (!empleado) throw errores.noEncontrado('Empleado no encontrado');
  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
  await query('INSERT INTO codigos_vinculacion (empleado_id, codigo, expira_en) VALUES (?, ?, ?)', [empleado.id, codigo, expiraEn]);
  res.status(201).json({ codigo, expiraEn });
});

export default router;
