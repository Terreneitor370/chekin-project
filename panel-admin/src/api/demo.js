import { today } from '../components/data';

export const DEMO_MODE = import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === '1';
export const demoSession = (rol = 'admin') => ({ token: 'demo-local-sin-jwt', usuario: { id: rol === 'admin' ? 1 : 2, email: `${rol}@demo.example`, rol } });

// An isolated, volatile adapter. No request, credential or file leaves this browser.
export function createDemoApi(getRole) {
  const names = ['Lucía Morales', 'Mateo Navarro', 'María-José Sánchez', "O'Brien Ángel", 'Jeshua E. Pérez', 'Valeria Soto', 'Emilia Torres', 'Santiago Luna', 'Camila Ríos', 'Nicolás Vega', 'Elena Fuentes', 'Andrés Flores'];
  const day = today();
  const state = {
    empleados: names.map((nombre, i) => ({ id: i + 1, nombre, email: `persona${i + 1}@demo.example`, horaEntrada: '08:00', toleranciaMin: 10, activo: i === 11 ? 0 : 1, tieneHuella: i % 3 !== 0, tieneFoto: i % 3 !== 0 })),
    usuarios: [{ id: 1, email: 'admin@demo.example', rol: 'admin', activo: 1 }, { id: 2, email: 'supervisor@demo.example', rol: 'supervisor', activo: 1 }, { id: 3, email: 'inactivo@demo.example', rol: 'supervisor', activo: 0 }],
    avisos: [{ id: 1, mensaje: 'Vista de demostración: todos los datos son ficticios.', activo: 1 }, { id: 2, mensaje: 'Pausa activa para el equipo.', activo: 1, fechaInicio: new Date(Date.now() + 60000).toISOString(), fechaFin: new Date(Date.now() + 120000).toISOString() }],
    multimedia: [],
  };
  const registros = state.empleados.slice(0, 7).map((e, i) => ({ id: i + 1, empleadoId: e.id, nombre: e.nombre, email: e.email, tipo: 'entrada', tarde: i === 2, registradoEn: `${day}T08:${String(i * 5).padStart(2, '0')}:00-07:00`, verificado: true, esReal: true, distancia: 0.28 }));
  let nextId = 100;
  const urls = new Set();
  const clone = value => JSON.parse(JSON.stringify(value));
  async function request(method, path, data, options) {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const url = new URL(path, 'https://demo.invalid');
    const [, collection, rawId, operation] = url.pathname.split('/');
    const id = Number(rawId);
    const admin = getRole() === 'admin';
    if (collection === 'usuarios' && !admin) throw new Error('Solo el administrador puede gestionar accesos.');
    if (collection === 'empleados' && !admin && (method === 'POST' || method === 'DELETE' || data?.activo !== undefined)) throw new Error('Esta acción requiere un administrador.');
    if (collection === 'checkins') return clone(registros.filter(r => !url.searchParams.get('fecha') || r.registradoEn.slice(0, 10) === url.searchParams.get('fecha')));
    if (collection === 'reportes') {
      const desde = url.searchParams.get('desde') || day;
      const hasta = url.searchParams.get('hasta') || day;
      const rows = registros.filter(r => r.registradoEn.slice(0, 10) >= desde && r.registradoEn.slice(0, 10) <= hasta);
      if (url.searchParams.get('formato') === 'csv') {
        const keys = ['nombre', 'email', 'tipo', 'tarde', 'registradoEn', 'verificado', 'esReal'];
        const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
        return [keys.join(','), ...rows.map(row => keys.map(key => cell(row[key])).join(','))].join('\r\n');
      }
      return clone(rows);
    }
    const rows = state[collection];
    if (!rows) throw new Error('Esta vista no está disponible en la demo.');
    if (method === 'GET') return clone(rows);
    if (operation === 'codigo') return { codigo: String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000), expiraEn: new Date(Date.now() + 900000).toISOString() };
    if (method === 'POST') {
      let record;
      if (collection === 'multimedia') {
        const objectUrl = URL.createObjectURL(data.get('video'));
        urls.add(objectUrl);
        record = { titulo: data.get('titulo'), orden: Number(data.get('orden')), url: objectUrl };
      } else {
        const { password, ...fields } = data;
        record = fields;
        if (rows.some(r => record.email && r.email === record.email)) throw new Error('Este correo ya existe en los datos de demostración.');
      }
      const created = { id: nextId++, activo: true, ...record };
      rows.push(created);
      return clone(created);
    }
    const record = rows.find(row => row.id === id);
    if (!record) throw new Error('No se encontró el registro de demostración.');
    if (method === 'DELETE') record.activo = false;
    else { const { password, ...fields } = data; Object.assign(record, fields); }
    return clone(record);
  }
  return {
    get: (path, options) => request('GET', path, undefined, options),
    post: (path, data, options) => request('POST', path, data, options),
    put: (path, data, options) => request('PUT', path, data, options),
    del: (path, options) => request('DELETE', path, undefined, options),
    dispose: () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); },
  };
}
