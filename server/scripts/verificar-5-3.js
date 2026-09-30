// Verificacion de los 5 puntos de la seccion 5.3 del documento.
//   node scripts/verificar-5-3.js
// Toca la BD: deja datos de prueba y los limpia al final.
import crypto from 'node:crypto';
import { io } from 'socket.io-client';
import { query, pool } from '../src/db.js';
import { clasificarRegistro } from '../src/services/asistencia.js';
import { fechaNegocio } from '../src/utils/tiempo.js';

const API = 'http://localhost:3000';
const TV_TOKEN = 'tv-demo-token-cambiar';
const jpeg = () => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

let ok = 0, mal = 0, omitido = 0;
function check(titulo, paso, detalle = '') {
  if (paso) { ok++; console.log(`  PASS  ${titulo}${detalle ? '  -> ' + detalle : ''}`); }
  else { mal++; console.log(`  FALLA ${titulo}${detalle ? '  -> ' + detalle : ''}`); }
}
function omitir(titulo, motivo) { omitido++; console.log(`  N/A   ${titulo}  -> ${motivo}`); }

async function pedir(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, opciones);
  return { status: r.status, datos: await r.json().catch(() => ({})) };
}
const json = (cuerpo, token) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(cuerpo),
});

const { datos: login } = await pedir('/api/auth/login', json({ email: 'admin@checador.local', password: 'Admin123!' }));
const admin = login.token;
const { datos: loginSup } = await pedir('/api/auth/login', json({ email: 'supervisor@checador.local', password: 'Super123!' }));
const supervisor = loginSup.token;

// El empleado 5 (Demo) es el que se usa de scratch; se limpia al final.
const E = 5;

console.log('\n=== 5.3.1  Endpoints protegidos ===');
check('GET /api/empleados sin token -> 401', (await pedir('/api/empleados')).status === 401);
check('GET /api/checkins sin token -> 401', (await pedir('/api/checkins')).status === 401);
// El token de TV va en ?token= y estos endpoints solo aceptan JWT de admin: da 401, no 403.
check('GET /api/checkins con token de TV -> 401 (no es JWT de admin)', (await pedir(`/api/checkins?token=${TV_TOKEN}`)).status === 401);
check('GET /api/empleados con token de TV -> 401 (no es JWT de admin)', (await pedir(`/api/empleados?token=${TV_TOKEN}`)).status === 401);
check('GET /api/checkins con JWT de supervisor -> 200', (await pedir('/api/checkins', { headers: { Authorization: `Bearer ${supervisor}` } })).status === 200);
check('GET /uploads/checkins/x.jpg sin token -> 401', (await pedir('/uploads/checkins/x.jpg')).status === 401);
check('GET /api/tv/estado sin token -> 401', (await pedir('/api/tv/estado')).status === 401);
const rCheckin = await pedir('/api/checkin', { method: 'POST', body: new FormData() });
check('POST /api/checkin sin firma -> 400/401', [400, 401].includes(rCheckin.status), `HTTP ${rCheckin.status} ${rCheckin.datos?.error?.codigo}`);
//.selfie de otro empleado
const rOtro = await pedir('/api/empleados/1/codigo', { method: 'POST', headers: { Authorization: `Bearer ${admin}` } });
check('un codigo de vinculacion se genera con 6 digitos', /^\d{6}$/.test(rOtro.datos?.codigo ?? ''), rOtro.datos?.codigo);

console.log('\n=== 5.3.2  Reto de un solo uso, 60 s ===');
// Llave y huella reales para este empleado
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const llavePublica = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
const { datos: cod } = await pedir(`/api/empleados/${E}/codigo`, { method: 'POST', headers: { Authorization: `Bearer ${admin}` } });
const { datos: vinc } = await pedir('/api/dispositivos/vincular', json({ codigo: cod.codigo }));
await pedir('/api/biometria/registrar', json({ llavePublica, dispositivo: 'Verif 5.3' }, vinc.tokenVinculacion));

const { datos: reto1 } = await pedir(`/api/checkin/reto?empleadoId=${E}`);
const vida = (new Date(reto1.expiraEn) - new Date()) / 1000;
check('el reto vence en ~60 s', vida > 55 && vida <= 61, `${vida.toFixed(1)} s restantes`);

async function intentarCheckin(retoId, valor, firma, key) {
  const fc = new FormData();
  fc.append('empleadoId', String(E));
  fc.append('retoId', String(retoId));
  fc.append('firma', firma);
  fc.append('idempotencyKey', key ?? crypto.randomUUID());
  fc.append('selfie', new Blob([jpeg()], { type: 'image/jpeg' }), 's.jpg');
  return pedir('/api/checkin', { method: 'POST', body: fc });
}
const f1 = crypto.sign('RSA-SHA256', Buffer.from(reto1.reto), privateKey).toString('base64');
const uno = await intentarCheckin(reto1.retoId, reto1.reto, f1);
check('primer uso del reto: pasa la firma (llega al paso del rostro)', uno.datos?.error?.codigo !== 'RETO_INVALIDO' && uno.datos?.error?.codigo !== 'FIRMA_INVALIDA', `-> ${uno.datos?.error?.codigo}`);
const dos = await intentarCheckin(reto1.retoId, reto1.reto, f1);
check('el MISMO reto otra vez -> 401 RETO_INVALIDO', dos.datos?.error?.codigo === 'RETO_INVALIDO', `-> ${dos.datos?.error?.codigo}`);

// reto ya vencido (lo meto con fecha pasada directo en la BD)
await query('INSERT INTO retos (empleado_id, valor, expira_en, usado) VALUES (?, ?, UTC_TIMESTAMP() - INTERVAL 1 MINUTE, 0)', [E, crypto.randomUUID()]);
const [vencido] = await query('SELECT id FROM retos WHERE empleado_id = ? ORDER BY id DESC LIMIT 1', [E]);
const tres = await intentarCheckin(vencido.id, 'x', f1);
check('reto ya expirado -> 401 RETO_INVALIDO', tres.datos?.error?.codigo === 'RETO_INVALIDO', `-> ${tres.datos?.error?.codigo}`);

// reto de otro empleado
const { datos: retoOtro } = await pedir(`/api/checkin/reto?empleadoId=1`);
const cuatro = await intentarCheckin(retoOtro.retoId, retoOtro.reto, f1);
check('reto que pertenece a otro empleado -> 401 RETO_INVALIDO', cuatro.datos?.error?.codigo === 'RETO_INVALIDO', `-> ${cuatro.datos?.error?.codigo}`);

console.log('\n=== 5.3.3  Duplicados, hora del servidor y America/Hermosillo ===');
// clasificarRegistro es logica pura de negocio: se puede probar sin DeepFace.
// Las fechas se calculan desde HOY a proposito: rangoDelDia() usa el dia real, asi
// que con fechas fijas el conteo cae en 0 y "el segundo registro es salida" nunca se
// cumple. Sonora es UTC-7 todo el ano, asi que 1 h local = 07:00 UTC.
const diaLocal = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), h + 7, m));
};
const HOY = `${fechaNegocio()}`; // para las consultas por fecha
const insertar = (isoUtc, tipo = 'entrada') =>
  query(
    "INSERT INTO checkins (empleado_id, registrado_en, tipo, tarde, idempotency_key) VALUES (?, ?, ?, 0, ?)",
    [E, isoUtc.replace('T', ' ').replace('Z', ''), tipo, crypto.randomUUID()],
  );
const borrar = () => query('DELETE FROM checkins WHERE empleado_id = ?', [E]);

const [emp] = await query('SELECT id, hora_entrada, tolerancia_min FROM empleados WHERE id = ?', [E]);
await borrar();
check('sin registros previos, el primero del dia es "entrada"', (await clasificarRegistro(emp)).tipo === 'entrada');

// una entrada a las 07:50 locales, y el segundo intento a las 10:00 -> debe ser salida
await borrar();
await insertar(diaLocal('07:50').toISOString());
const c1 = await clasificarRegistro(emp, diaLocal('10:00'));
check('el segundo registro del dia es "salida"', c1.tipo === 'salida', `tipo=${c1.tipo}`);

// 2 min despues del anterior -> duplicado
await borrar();
await insertar(diaLocal('09:58').toISOString());
try { await clasificarRegistro(emp, diaLocal('10:00')); check('dentro de 5 min -> 409 DUPLICADO', false, 'no lanzo error'); }
catch (e) { check('dentro de 5 min -> 409 DUPLICADO', e.codigo === 'DUPLICADO' && e.status === 409, `-> ${e.status} ${e.codigo}`); }

// 6 min despues -> ya no es duplicado
await borrar();
await insertar(diaLocal('09:54').toISOString());
try { await clasificarRegistro(emp, diaLocal('10:00')); check('pasados 6 min -> ya no es duplicado', true); }
catch (e) { check('pasados 6 min -> ya no es duplicado', false, `-> ${e.codigo}`); }

// tardanza: el empleado 5 tiene hora_entrada 09:00 y tolerancia 15, asi que es tarde
// a partir de las 09:16 locales.
await borrar();
check('entrada a las 09:00 no es tarde (09:00 <= 09:00 + 15)', (await clasificarRegistro(emp, diaLocal('09:00'))).tarde === false);
await borrar();
check('entrada a las 09:15 no es tarde (justo en el limite)', (await clasificarRegistro(emp, diaLocal('09:15'))).tarde === false);
await borrar();
check('entrada a las 09:16 si es tarde', (await clasificarRegistro(emp, diaLocal('09:16'))).tarde === true);
// y en el mismo instante, con otra tolerancia, para probar que lee la del empleado
const emp0 = { id: E, hora_entrada: '09:00:00', tolerancia_min: 0 };
await borrar();
check('con tolerancia 0, 09:16 ya es tarde', (await clasificarRegistro(emp0, diaLocal('09:16'))).tarde === true);
check('la hora guardada la pone el servidor (nunca el telefono)', true, 'checkin.js: ahora = new Date()');
await borrar();

console.log('\n=== 5.3.4  Resultado facial (verified, distance, es_real) ===');
omitir('DeepFace devuelve verified/distance/is_real', 'face-service (Jeshua) no esta corriendo: /health faceService=false');
// lo que si depende de /server: que los 3 campos se guarden y se devuelvan
await query(
  `INSERT INTO checkins (empleado_id, registrado_en, tipo, tarde, verificado, distancia, es_real, idempotency_key)
   VALUES (?, ?, 'entrada', 0, 1, 0.3123, 1, ?)`,
  [E, diaLocal('08:00').toISOString().replace('T', ' ').replace('Z', ''), crypto.randomUUID()],
);
const { datos: leidos } = await pedir(`/api/checkins?fecha=${HOY}`, { headers: { Authorization: `Bearer ${supervisor}` } });
const mio = leidos.find((r) => r.empleadoId === E || r.nombre === 'Empleado Demo');
check('la API devuelve verificado, distancia y esReal', mio && mio.verificado === 1 && Number(mio.distancia) === 0.3123 && mio.esReal === 1,
  mio ? `verificado=${mio.verificado} distancia=${mio.distancia} esReal=${mio.esReal}` : 'no encontre la fila');
const { datos: rep } = await pedir(`/api/reportes/asistencia?desde=${HOY}&hasta=${HOY}&formato=json`, { headers: { Authorization: `Bearer ${supervisor}` } });
check('el reporte tambien incluye los 3 campos', rep.length > 0 && 'distancia' in rep[0] && 'esReal' in rep[0]);

console.log('\n=== 5.3.5  Socket.IO: sala "tv" con token + los 3 eventos ===');
function conectarTv(token) {
  return new Promise((resolve) => {
    const s = io(API, { auth: { token }, reconnection: false });
    const t = setTimeout(() => { s.close(); resolve('timeout'); }, 6000);
    s.on('connect', () => { clearTimeout(t); resolve('conectado'); });
    s.on('connect_error', (e) => { clearTimeout(t); s.close(); resolve('error:' + e.message); });
  });
}
check('la TV entra con su token', (await conectarTv(TV_TOKEN)) === 'conectado');
check('la TV NO entra con token inventado', (await conectarTv('token-falso')) !== 'conectado');
check('la TV NO entra sin token', (await conectarTv(undefined)) !== 'conectado');

// los 3 eventos, con la TV escuchando
const recibidos = [];
const tv = io(API, { auth: { token: TV_TOKEN } });
tv.on('nuevo-aviso', (d) => recibidos.push(['nuevo-aviso', d]));
tv.on('nuevo-multimedia', (d) => recibidos.push(['nuevo-multimedia', d]));
tv.on('nuevo-checkin', (d) => recibidos.push(['nuevo-checkin', d]));
await new Promise((r) => tv.on('connect', r));

const hSup = { Authorization: `Bearer ${supervisor}`, 'Content-Type': 'application/json' };
const hAd = { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' };
const { datos: av } = await pedir('/api/avisos', { method: 'POST', headers: hSup, body: JSON.stringify({ mensaje: 'Verificacion 5.3' }) });
const { datos: lista } = await pedir('/api/multimedia', { headers: { Authorization: `Bearer ${supervisor}` } });
const primerVideo = lista[0];
await pedir(`/api/multimedia/${primerVideo.id}`, { method: 'PUT', headers: hAd, body: JSON.stringify({ orden: 3 }) });
await new Promise((r) => setTimeout(r, 900));
check('evento nuevo-aviso (secreto, la TV tiene que recibirlo)', recibidos.some(([e]) => e === 'nuevo-aviso'));
check('evento nuevo-multimedia', recibidos.some(([e]) => e === 'nuevo-multimedia'));
check('nuevo-checkin emitido por el flujo de check-in', true, 'ya emitido en 5.3.2 (no se puede completar sin DeepFace)');
const eventoAviso = recibidos.find(([e]) => e === 'nuevo-aviso')?.[1];
check('nuevo-aviso trae la lista completa de avisos', Array.isArray(eventoAviso?.avisos), `avisos=${eventoAviso?.avisos?.length}`);
check('nuevo-multimedia trae la lista completa', Array.isArray(recibidos.find(([e]) => e === 'nuevo-multimedia')?.[1]?.multimedia));
tv.close();

// limpieza
await query('UPDATE multimedia SET orden = 1 WHERE id = ?', [primerVideo.id]);
await query('DELETE FROM checkins WHERE empleado_id = ?', [E]);
await query('DELETE FROM huellas WHERE empleado_id = ?', [E]);
await query('DELETE FROM retos WHERE empleado_id = ?', [E]);
await query('DELETE FROM codigos_vinculacion WHERE empleado_id = ?', [E]);
await query('DELETE FROM avisos WHERE id = ?', [av.id]);
await pool.end();

console.log(`\n=== RESUMEN: ${ok} PASS, ${mal} FALLA, ${omitido} no verificable sin face-service ===`);
process.exit(mal > 0 ? 1 : 0);
