// Comprueba contra la API viva que un PUT/DELETE con un id que no existe da 404
// y no un "ok" mentiroso, y que re-aplicar lo mismo NO da un 404 falso.
//
//   node scripts/verificar-404.js
//
// Necesita la API corriendo (npm start) y el .env local. No entra en `npm test`
// porque esas pruebas son puras y no tocan MySQL.
//
// IMPORTANTE: no modifica los datos semilla. El aviso de prueba lo crea aqui mismo
// y lo borra al final; en multimedia solo se comprueba el caso 404 y un PUT que
// reescribe el valor que ya tiene.
const API = process.env.API_URL || 'http://127.0.0.1:3000';
const NINGUNA = 999999;
let fallas = 0;

async function pedir(ruta, { token, ...o } = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...o,
    headers: {
      ...(o.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return { status: r.status, datos: await r.json().catch(() => ({})) };
}
const post = (b) => ({ method: 'POST', body: JSON.stringify(b) });
const put = (b) => ({ method: 'PUT', body: JSON.stringify(b) });
const del = () => ({ method: 'DELETE' });

function check(ok, etiqueta, extra = '') {
  if (!ok) fallas++;
  console.log(`${ok ? '  ok  ' : ' FALLA'} ${etiqueta.padEnd(46)}${extra}`);
}
const es404 = (r) => r.status === 404 && r.datos?.error?.codigo === 'NO_ENCONTRADO';

const admin = (await pedir('/api/auth/login', post({ email: 'admin@checador.local', password: 'Admin123!' }))).datos?.token;
if (!admin) {
  console.log('No se pudo iniciar sesion como admin. Revisa el .env y la contrasena del seed.');
  process.exit(1);
}

console.log('\nid inexistente -> 404 NO_ENCONTRADO');
check(es404(await pedir(`/api/usuarios/${NINGUNA}`, { token: admin, ...put({ rol: 'supervisor' }) })), 'PUT /api/usuarios');
check(es404(await pedir(`/api/empleados/${NINGUNA}`, { token: admin, ...put({ horaEntrada: '09:00' }) })), 'PUT /api/empleados');
check(es404(await pedir(`/api/empleados/${NINGUNA}`, { token: admin, ...del() })), 'DELETE /api/empleados');
check(es404(await pedir(`/api/avisos/${NINGUNA}`, { token: admin, ...put({ mensaje: 'x' }) })), 'PUT /api/avisos');
check(es404(await pedir(`/api/avisos/${NINGUNA}`, { token: admin, ...del() })), 'DELETE /api/avisos');
check(es404(await pedir(`/api/multimedia/${NINGUNA}`, { token: admin, ...put({ orden: 1 }) })), 'PUT /api/multimedia');
check(es404(await pedir(`/api/multimedia/${NINGUNA}`, { token: admin, ...del() })), 'DELETE /api/multimedia');

// Aviso propio para el resto: asi el script no toca los avisos del seed.
const creado = await pedir('/api/avisos', { token: admin, ...post({ mensaje: 'Verificacion 404 (temporal)' }) });
check(creado.status === 201, 'crear aviso de prueba', `-> ${creado.status}`);
const idAviso = creado.datos?.id;
const borrar = () => pedir(`/api/avisos/${idAviso}`, { token: admin, ...del() });

console.log('\nid existente -> 200');
check((await pedir('/api/usuarios/1', { token: admin, ...put({}) })).status === 200, 'PUT /api/usuarios/1');
check((await pedir('/api/empleados/1', { token: admin, ...put({}) })).status === 200, 'PUT /api/empleados/1');
check((await pedir(`/api/avisos/${idAviso}`, { token: admin, ...put({ mensaje: 'Verificacion 404 (temporal)' }) })).status === 200, 'PUT del aviso de prueba');

// El caso que casi se rompe: si el UPDATE no cambia nada, un "affectedRows === 0"
// ingenuo daria 404 falso. mysql2 reporta filas ENCONTRADAS, asi que esto da 200.
console.log('\nre-aplicar lo mismo (NO puede ser 404)');
const [video] = (await pedir('/api/multimedia', { token: admin })).datos ?? [];
const mismoValor = await pedir(`/api/multimedia/${video.id}`, { token: admin, ...put({ orden: video.orden }) });
check(mismoValor.status === 200, `PUT multimedia con su mismo orden (${video.orden})`, `-> ${mismoValor.status}`);

await borrar();
const segundo = await borrar();
check(segundo.status === 200, 'DELETE de algo ya desactivado', `-> ${segundo.status}`);

console.log('\nlimpieza');
// DELETE solo desactiva, asi que hay que borrarlo de verdad de la tabla.
const { pool } = await import('../src/db.js');
await pool.execute('DELETE FROM avisos WHERE id = ?', [idAviso]);
const queda = (await pedir('/api/avisos', { token: admin })).datos?.some((a) => a.id === idAviso);
check(!queda, 'el aviso de prueba ya no esta', `-> ${queda ? 'SIGUE' : 'eliminado'}`);
const semillas = (await pedir('/api/avisos', { token: admin })).datos ?? [];
check(semillas.length === 3, 'los avisos del seed siguen intactos (3)', `-> ${semillas.length}`);

console.log(fallas === 0 ? '\nTODO CORRECTO' : `\n${fallas} FALLAS`);
process.exit(fallas === 0 ? 0 : 1);
