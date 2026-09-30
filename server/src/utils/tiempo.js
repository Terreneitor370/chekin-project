// Estas funciones son puras y no tocan la base de datos, así que se leen directo de
// process.env en vez de importar config.js: importar config dispara requerido('DB_USER')
// y 'JWT_SECRET', y entonces test/tiempo.test.js no correría en un clon sin .env.
const ZONA = process.env.TZ_NEGOCIO || 'America/Hermosillo';

// Devuelve la fecha "de negocio" (YYYY-MM-DD) en America/Hermosillo.
export function fechaNegocio(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(date);
}

// Hora local HH:MM:SS en America/Hermosillo.
export function horaNegocio(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
}

// Rango UTC [inicio, fin) del día de negocio. Sonora es UTC-7 todo el año (sin horario de verano).
export function rangoDelDia(fecha = fechaNegocio()) {
  const inicio = new Date(`${fecha}T00:00:00-07:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

// Resta N días a una fecha YYYY-MM-DD como calendario puro, sin pasar por la zona
// horaria. Restar sobre un instante UTC y volver a formatear en Hermosillo quita
// un día (el medianoche UTC del lunes es el domingo 17:00 aquí), que es como un
// rango de "últimos 7 días" terminaba cubriendo 8.
export function restarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

// ¿La hora local supera hora_entrada + tolerancia?
export function esTarde(horaEntrada, toleranciaMin, date = new Date()) {
  const [h, m] = horaEntrada.split(':').map(Number);
  const [hl, ml] = horaNegocio(date).split(':').map(Number);
  return hl * 60 + ml > h * 60 + m + Number(toleranciaMin);
}
