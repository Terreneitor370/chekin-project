import { Router } from 'express';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { requireVinculacion } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import { limpiarBase64, validarLlavePublica } from '../services/firma.js';
import { registrarBiometria as esquemaBiometria } from '../validacion.js';

const router = Router();

// POST /api/biometria/registrar  { llavePublica, dispositivo }  (la huella como dato ligado al usuario)
router.post('/registrar', requireVinculacion, validar(esquemaBiometria), async (req, res) => {
  const { llavePublica, dispositivo } = req.body;
  try {
    validarLlavePublica(llavePublica);
  } catch {
    throw errores.datosInvalidos('La llave pública no es válida');
  }
  await query('UPDATE huellas SET activa = 0 WHERE empleado_id = ?', [req.empleadoId]);
  const r = await query(
    'INSERT INTO huellas (empleado_id, llave_publica, dispositivo) VALUES (?, ?, ?)',
    [req.empleadoId, limpiarBase64(llavePublica), String(dispositivo ?? '').slice(0, 120)],
  );
  res.status(201).json({ huellaId: r.insertId, empleadoId: req.empleadoId });
});

export default router;
