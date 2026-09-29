import { Router } from 'express';
import { query, modificar } from '../db.js';
import { errores } from '../utils/errores.js';
import { requireRol } from '../middlewares/auth.js';
import { subirVideo } from '../middlewares/upload.js';
import { validar } from '../middlewares/validar.js';
import { guardarArchivo } from '../services/archivos.js';
import { multimediaActiva } from '../services/estadoTv.js';
import { emitirTv, EVENTOS } from '../services/eventos.js';
import {
  actualizarMultimedia as esquemaActualizarMultimedia,
  crearMultimedia as esquemaCrearMultimedia,
  idParam,
} from '../validacion.js';

const router = Router();

async function notificarTv() {
  emitirTv(EVENTOS.NUEVO_MULTIMEDIA, { multimedia: await multimediaActiva() });
}

router.get('/', requireRol('supervisor'), async (_req, res) => {
  res.json(await query('SELECT id, titulo, url, orden, activo FROM multimedia ORDER BY orden, id'));
});

// POST /api/multimedia  (multipart: video MP4, titulo, orden)
router.post('/', requireRol('admin'), subirVideo.single('video'), validar(esquemaCrearMultimedia), async (req, res) => {
  if (!req.file) throw errores.datosInvalidos('Falta el archivo "video"');
  // MP4: bytes 4-7 = "ftyp"
  if (req.file.buffer.subarray(4, 8).toString('ascii') !== 'ftyp') throw errores.datosInvalidos('El video debe ser MP4');
  const ruta = await guardarArchivo('multimedia', req.file.buffer, 'mp4');
  const { titulo, orden } = req.body;
  const r = await query('INSERT INTO multimedia (titulo, url, orden) VALUES (?, ?, ?)', [
    titulo, `/uploads/${ruta}`, orden,
  ]);
  await notificarTv();
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', requireRol('admin'), validar(idParam, 'params'), validar(esquemaActualizarMultimedia), async (req, res) => {
  const { titulo, orden, activo } = req.body;
  await modificar('UPDATE multimedia SET titulo = COALESCE(?, titulo), orden = COALESCE(?, orden), activo = COALESCE(?, activo) WHERE id = ?', [
    titulo ?? null, orden ?? null, activo === undefined ? null : (activo ? 1 : 0), req.params.id,
  ], 'Video no encontrado');
  await notificarTv();
  res.json({ ok: true });
});

router.delete('/:id', requireRol('admin'), validar(idParam, 'params'), async (req, res) => {
  await modificar('UPDATE multimedia SET activo = 0 WHERE id = ?', [req.params.id], 'Video no encontrado');
  await notificarTv();
  res.json({ ok: true });
});

export default router;
