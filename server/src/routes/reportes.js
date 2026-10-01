import { Router } from 'express';
import { query } from '../db.js';
import { requireRol } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import { fechaNegocio, rangoDelDia } from '../utils/tiempo.js';
import { checkinsQuery, reporteAsistencia } from '../validacion.js';

const router = Router();
router.use(requireRol('supervisor'));

async function checkinsEntre(desde, hasta) {
  const inicio = rangoDelDia(desde).inicio;
  const fin = rangoDelDia(hasta).fin;
  return query(
    `SELECT c.id, e.nombre, c.tipo, c.tarde, c.registrado_en AS registradoEn,
            c.verificado, c.distancia, c.es_real AS esReal
     FROM checkins c JOIN empleados e ON e.id = c.empleado_id
     WHERE c.registrado_en >= ? AND c.registrado_en < ?
     ORDER BY c.registrado_en`,
    [inicio, fin],
  );
}

// GET /api/checkins?fecha=YYYY-MM-DD
export const checkinsRouter = Router();
checkinsRouter.use(requireRol('supervisor'));
checkinsRouter.get('/', validar(checkinsQuery, 'query'), async (req, res) => {
  const fecha = req.query.fecha ?? fechaNegocio();
  res.json(await checkinsEntre(fecha, fecha));
});

// GET /api/reportes/asistencia?desde=...&hasta=...&formato=json|csv
router.get('/asistencia', validar(reporteAsistencia, 'query'), async (req, res) => {
  const { desde, hasta, formato } = req.query;
  const filas = await checkinsEntre(desde, hasta);
  if (formato !== 'csv') return res.json(filas);
  const encabezado = 'id,nombre,tipo,tarde,registrado_en,verificado,distancia';
  const lineas = filas.map((f) =>
    [f.id, `"${String(f.nombre).replace(/"/g, '""')}"`, f.tipo, f.tarde, new Date(f.registradoEn).toISOString(), f.verificado, f.distancia ?? ''].join(','),
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="asistencia_${desde}_${hasta}.csv"`);
  res.send([encabezado, ...lineas].join('\n'));
});

export default router;
