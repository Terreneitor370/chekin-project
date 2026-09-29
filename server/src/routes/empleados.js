import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { requireRol, requireVinculacion } from '../middlewares/auth.js';
import { subirImagen, exigirImagen } from '../middlewares/upload.js';
import { validar } from '../middlewares/validar.js';
import { validarFoto } from '../services/faceClient.js';
import { guardarArchivo } from '../services/archivos.js';
import {
  actualizarEmpleado as esquemaActualizarEmpleado,
  crearEmpleado as esquemaCrearEmpleado,
  idParam,
} from '../validacion.js';

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

// empleados.email es UNIQUE. Sin esto, repetir un correo devolvía 500 con el error
// crudo de MySQL; el contrato pide 409 con mensaje en español.
async function exigirEmailLibre(email, idExcluido = null) {
  if (!email) return;
  const [repetido] = await query(
    'SELECT id FROM empleados WHERE email = ? AND (? IS NULL OR id <> ?)',
    [email, idExcluido, idExcluido],
  );
  if (repetido) throw errores.emailDuplicado();
}

// Red de seguridad: si dos altas con el mismo correo corren a la vez, el UNIQUE
// salta en MySQL y el translate lo convierte en el mismo 409.
function traducirDuplicado(e) {
  if (e?.code === 'ER_DUP_ENTRY' && /empleados\.email/.test(e.sqlMessage ?? '')) {
    return errores.emailDuplicado();
  }
  return e;
}

// POST /api/empleados
router.post('/', requireRol('admin'), validar(esquemaCrearEmpleado), async (req, res) => {
  const { nombre, email = null, horaEntrada, toleranciaMin } = req.body;
  await exigirEmailLibre(email);
  let r;
  try {
    r = await query(
      'INSERT INTO empleados (nombre, email, hora_entrada, tolerancia_min) VALUES (?, ?, ?, ?)',
      [nombre, email, horaEntrada, toleranciaMin],
    );
  } catch (e) {
    throw traducirDuplicado(e);
  }
  res.status(201).json({ id: r.insertId });
});

// PUT /api/empleados/:id
router.put('/:id', requireRol('admin'), validar(idParam, 'params'), validar(esquemaActualizarEmpleado), async (req, res) => {
  const { nombre, email, horaEntrada, toleranciaMin, activo } = req.body;
  // Excluyo el propio id: reenviar el mismo correo del empleado que se está
  // editando no es un conflicto.
  await exigirEmailLibre(email, req.params.id);
  try {
    await query(
      `UPDATE empleados SET
         nombre = COALESCE(?, nombre), email = COALESCE(?, email),
         hora_entrada = COALESCE(?, hora_entrada), tolerancia_min = COALESCE(?, tolerancia_min),
         activo = COALESCE(?, activo)
       WHERE id = ?`,
      [nombre ?? null, email ?? null, horaEntrada ?? null, toleranciaMin ?? null, activo === undefined ? null : (activo ? 1 : 0), req.params.id],
    );
  } catch (e) {
    throw traducirDuplicado(e);
  }
  res.json({ ok: true });
});

// DELETE /api/empleados/:id  (desactiva, conserva historial)
router.delete('/:id', requireRol('admin'), validar(idParam, 'params'), async (req, res) => {
  await query('UPDATE empleados SET activo = 0 WHERE id = ?', [req.params.id]);
  await query('UPDATE huellas SET activa = 0 WHERE empleado_id = ?', [req.params.id]);
  res.json({ ok: true });
});

// POST /api/empleados/:id/codigo  (código de vinculación de 6 dígitos, 15 min)
router.post('/:id/codigo', requireRol('admin'), validar(idParam, 'params'), async (req, res) => {
  const [empleado] = await query('SELECT id FROM empleados WHERE id = ? AND activo = 1', [req.params.id]);
  if (!empleado) throw errores.noEncontrado('Empleado no encontrado');
  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
  await query('INSERT INTO codigos_vinculacion (empleado_id, codigo, expira_en) VALUES (?, ?, ?)', [empleado.id, codigo, expiraEn]);
  res.status(201).json({ codigo, expiraEn });
});

export default router;
