import { Router } from 'express';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { requireRol } from '../middlewares/auth.js';
import { subirVideo } from '../middlewares/upload.js';
import { guardarArchivo } from '../services/archivos.js';
import { multimediaActiva } from '../services/estadoTv.js';
import { emitirTv, EVENTOS } from '../services/eventos.js';

const router = Router();

async function notificarTv() {
  emitirTv(EVENTOS.NUEVO_MULTIMEDIA, { multimedia: await multimediaActiva() });
}

router.get('/', requireRol('supervisor'), async (_req, res) => {
  res.json(await query('SELECT id, titulo, url, orden, activo FROM multimedia ORDER BY orden, id'));
});

// POST /api/multimedia  (multipart: video MP4, titulo, orden)
router.post('/', requireRol('admin'), subirVideo.single('video'), async (req, res) => {
  if (!req.file) throw errores.datosInvalidos('Falta el archivo "video"');
  // MP4: bytes 4-7 = "ftyp"
  if (req.file.buffer.subarray(4, 8).toString('ascii') !== 'ftyp') throw errores.datosInvalidos('El video debe ser MP4');
  const ruta = await guardarArchivo('multimedia', req.file.buffer, 'mp4');
  const r = await query('INSERT INTO multimedia (titulo, url, orden) VALUES (?, ?, ?)', [
    req.body.titulo ?? 'Video', `/uploads/${ruta}`, Number(req.body.orden ?? 1),
  ]);
  await notificarTv();
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', requireRol('admin'), async (req, res) => {
  const { titulo, orden, activo } = req.body ?? {};
  await query('UPDATE multimedia SET titulo = COALESCE(?, titulo), orden = COALESCE(?, orden), activo = COALESCE(?, activo) WHERE id = ?', [
    titulo ?? null, orden ?? null, activo ?? null, req.params.id,
  ]);
  await notificarTv();
  res.json({ ok: true });
});

router.delete('/:id', requireRol('admin'), async (req, res) => {
  await query('UPDATE multimedia SET activo = 0 WHERE id = ?', [req.params.id]);
  await notificarTv();
  res.json({ ok: true });
});

export default router;
