import { Router } from 'express';
import crypto from 'node:crypto';
import { query, pool } from '../db.js';
import { errores } from '../utils/errores.js';
import { subirImagen, exigirImagen } from '../middlewares/upload.js';
import { validar } from '../middlewares/validar.js';
import { verificarFirma } from '../services/firma.js';
import { verificarRostro } from '../services/faceClient.js';
import { guardarArchivo, leerArchivo } from '../services/archivos.js';
import { clasificarRegistro } from '../services/asistencia.js';
import { emitirTv, EVENTOS } from '../services/eventos.js';
import { estadoDelDia } from '../services/estadoTv.js';
import { checkin as esquemaCheckin, retoQuery } from '../validacion.js';

const router = Router();

// GET /api/checkin/reto?empleadoId=3  -> reto de un solo uso (60 s)
router.get('/reto', validar(retoQuery, 'query'), async (req, res) => {
  const { empleadoId } = req.query;
  const [empleado] = await query('SELECT id FROM empleados WHERE id = ? AND activo = 1', [empleadoId]);
  if (!empleado) throw errores.noEncontrado('Empleado no encontrado');
  const reto = crypto.randomUUID();
  const expiraEn = new Date(Date.now() + 60 * 1000);
  const r = await query('INSERT INTO retos (empleado_id, valor, expira_en) VALUES (?, ?, ?)', [empleadoId, reto, expiraEn]);
  res.json({ retoId: r.insertId, reto, expiraEn });
});

// POST /api/checkin  (multipart: empleadoId, retoId, firma, idempotencyKey, selfie)
router.post('/', subirImagen.single('selfie'), exigirImagen('selfie'), validar(esquemaCheckin), async (req, res) => {
  const { empleadoId, retoId, firma, idempotencyKey } = req.body;

  // 0. Reintento de red: si ya existe ese idempotencyKey, devolver el mismo resultado
  const [previo] = await query(
    `SELECT c.id, c.tipo, c.tarde, c.registrado_en, c.verificado, c.distancia, c.es_real, e.id AS empleadoId, e.nombre
     FROM checkins c JOIN empleados e ON e.id = c.empleado_id WHERE c.idempotency_key = ?`,
    [idempotencyKey],
  );
  if (previo) return res.status(201).json(respuesta(previo));

  // 1. Reto válido, del mismo empleado, no usado y no expirado (se marca usado de inmediato)
  const marcado = await query(
    'UPDATE retos SET usado = 1 WHERE id = ? AND empleado_id = ? AND usado = 0 AND expira_en > UTC_TIMESTAMP()',
    [retoId, empleadoId],
  );
  if (marcado.affectedRows !== 1) throw errores.retoInvalido();
  const [reto] = await query('SELECT valor FROM retos WHERE id = ?', [retoId]);

  // 2. Firma con la huella: identifica al usuario
  const [huella] = await query(
    'SELECT id, llave_publica FROM huellas WHERE empleado_id = ? AND activa = 1 ORDER BY id DESC LIMIT 1',
    [empleadoId],
  );
  if (!huella || !verificarFirma({ llavePublica: huella.llave_publica, payload: reto.valor, firma })) {
    throw errores.firmaInvalida();
  }

  // 3. Rostro: DeepFace compara la foto de registro con la selfie (1 a 1)
  const [empleado] = await query(
    'SELECT id, nombre, hora_entrada, tolerancia_min, foto_registro_path FROM empleados WHERE id = ? AND activo = 1',
    [empleadoId],
  );
  if (!empleado?.foto_registro_path) throw errores.datosInvalidos('El empleado no tiene foto de registro');
  const fotoRegistro = await leerArchivo(empleado.foto_registro_path);
  const rostro = await verificarRostro(fotoRegistro, req.file.buffer);
  if (rostro.is_real === false) throw errores.rostroNoReal();
  if (!rostro.verified) throw errores.rostroNoCoincide();

  // 4. Reglas de asistencia (duplicado, entrada/salida, tardanza) y guardado
  const ahora = new Date();
  const { tipo, tarde } = await clasificarRegistro(empleado, ahora);
  const fotoPath = await guardarArchivo('checkins', req.file.buffer);
  const [ins] = await pool.execute(
    `INSERT INTO checkins
       (empleado_id, huella_id, registrado_en, tipo, tarde, foto_path, verificado, distancia, es_real, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    [empleado.id, huella.id, ahora, tipo, tarde ? 1 : 0, fotoPath, rostro.distance ?? null, rostro.is_real === undefined ? null : (rostro.is_real ? 1 : 0), idempotencyKey],
  );

  // 5. Evento en tiempo real para la TV (sala "tv")
  const estado = await estadoDelDia();
  emitirTv(EVENTOS.NUEVO_CHECKIN, {
    checkinId: ins.insertId,
    empleadoId: empleado.id,
    nombre: empleado.nombre,
    tipo,
    tarde,
    hora: ahora,
    fotoUrl: `/uploads/${fotoPath}`, // el dashboard agrega ?token=
    totales: estado.totales,
  });

  res.status(201).json({
    checkin: { id: ins.insertId, tipo, tarde, registradoEn: ahora },
    empleado: { id: empleado.id, nombre: empleado.nombre },
    verificacion: { verificado: true, distancia: rostro.distance ?? null, esReal: rostro.is_real ?? null },
  });
});

function respuesta(fila) {
  return {
    checkin: { id: fila.id, tipo: fila.tipo, tarde: Boolean(fila.tarde), registradoEn: fila.registrado_en },
    empleado: { id: fila.empleadoId, nombre: fila.nombre },
    verificacion: { verificado: Boolean(fila.verificado), distancia: fila.distancia, esReal: fila.es_real === null ? null : Boolean(fila.es_real) },
  };
}

export default router;
