export const yes = value => value === true || value === 1 || value === '1';
export const active = item => item.activo == null || yes(item.activo);
export function list(data, key) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  throw new Error('La respuesta del servidor no contiene la lista esperada.');
}
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Hermosillo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const time = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleTimeString('es-MX', { timeZone: 'America/Hermosillo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '—';
export const dateTime = value => {
  if (!value) return 'Sin fecha';
  const esFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const fecha = esFecha ? new Date(value + 'T00:00:00-07:00') : new Date(value);
  if (!Number.isFinite(fecha.getTime())) return 'Sin fecha';
  const opciones = esFecha
    ? { timeZone: 'America/Hermosillo', day: '2-digit', month: 'short', year: 'numeric' }
    : { timeZone: 'America/Hermosillo', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  return fecha.toLocaleString('es-MX', opciones);
};
export const localDate = value => value ? /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(new Date(value).getTime() - 7 * 3600000).toISOString().slice(0, 10) : '';
const desplazado = años => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + años);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Hermosillo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};
export const minFecha = () => desplazado(-1);
export const maxFecha = () => desplazado(1);
export const toISO = value => value ? new Date(`${value}:00-07:00`).toISOString() : undefined;
export const personName = row => row.nombre ?? row.empleado?.nombre ?? 'Sin nombre';
export const recorded = row => row.registradoEn ?? row.checkin?.registradoEn;
export const verified = row => row.verificado ?? row.verificacion?.verificado;
