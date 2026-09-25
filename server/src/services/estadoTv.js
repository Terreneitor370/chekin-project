import { query } from '../db.js';
import { fechaNegocio, rangoDelDia } from '../utils/tiempo.js';

export async function avisosActivos() {
  const hoy = fechaNegocio();
  return query(
    `SELECT id, mensaje FROM avisos
     WHERE activo = 1
       AND (fecha_inicio IS NULL OR fecha_inicio <= ?)
       AND (fecha_fin IS NULL OR fecha_fin >= ?)
     ORDER BY id DESC`,
    [hoy, hoy],
  );
}

export async function multimediaActiva() {
  return query('SELECT id, titulo, url, orden FROM multimedia WHERE activo = 1 ORDER BY orden, id');
}

// Estado completo del día para la TV (GET /api/tv/estado)
export async function estadoDelDia(tokenTv) {
  const fecha = fechaNegocio();
  const { inicio, fin } = rangoDelDia(fecha);
  const empleados = await query('SELECT id, nombre FROM empleados WHERE activo = 1 ORDER BY nombre');
  const entradas = await query(
    `SELECT c.id, c.empleado_id, e.nombre, c.registrado_en, c.tarde, c.foto_path
     FROM checkins c JOIN empleados e ON e.id = c.empleado_id
     WHERE c.tipo = 'entrada' AND c.registrado_en >= ? AND c.registrado_en < ?
     ORDER BY c.registrado_en`,
    [inicio, fin],
  );
  const conEntrada = new Set(entradas.map((r) => r.empleado_id));
  const llegaron = entradas.map((r) => ({
    empleadoId: r.empleado_id,
    nombre: r.nombre,
    hora: r.registrado_en,
    tarde: Boolean(r.tarde),
    fotoUrl: r.foto_path ? `/uploads/${r.foto_path}?token=${encodeURIComponent(tokenTv ?? '')}` : null,
  }));
  return {
    fecha,
    totales: {
      empleados: empleados.length,
      presentes: llegaron.length,
      tardanzas: llegaron.filter((l) => l.tarde).length,
    },
    llegaron,
    faltan: empleados.filter((e) => !conEntrada.has(e.id)).map((e) => ({ empleadoId: e.id, nombre: e.nombre })),
    avisos: await avisosActivos(),
    multimedia: await multimediaActiva(),
  };
}
