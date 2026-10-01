// Simula el flujo completo SIN teléfono: admin genera código -> "celular" se vincula,
// registra su llave y su foto -> firma un reto -> check-in -> la "TV" recibe el evento.
// Uso: API_URL=http://localhost:3000 FOTO_REGISTRO=./yo1.jpg SELFIE=./yo2.jpg npm run simular
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { io } from 'socket.io-client';

const API = process.env.API_URL ?? 'http://localhost:3000';
const TV_TOKEN = process.env.TV_TOKEN ?? 'tv-demo-token-cambiar';
const EMPLEADO_ID = Number(process.env.EMPLEADO_ID ?? 1);

async function pedir(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, opciones);
  const datos = await r.json().catch(() => ({}));
  console.log(`${opciones.method ?? 'GET'} ${ruta} -> ${r.status}`, JSON.stringify(datos).slice(0, 160));
  if (!r.ok) throw new Error(datos?.error?.codigo ?? r.status);
  return datos;
}
const json = (cuerpo, token) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(cuerpo),
});
const foto = async (ruta) => new Blob([await fs.readFile(ruta)], { type: 'image/jpeg' });

// TV escuchando eventos
const tv = io(API, { auth: { token: TV_TOKEN } });
tv.on('nuevo-checkin', (e) => console.log('[TV] nuevo-checkin:', e.nombre, e.tipo, e.tarde ? 'tarde' : 'a tiempo'));
await new Promise((ok) => tv.on('connect', ok));

// 1. Admin
const { token } = await pedir('/api/auth/login', json({ email: 'admin@checador.local', password: 'Admin123!' }));
const { codigo } = await pedir(`/api/empleados/${EMPLEADO_ID}/codigo`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });

// 2. "Celular": vincular + registrar huella (llave) + foto
const { tokenVinculacion } = await pedir('/api/dispositivos/vincular', json({ codigo }));
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const llavePublica = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
await pedir('/api/biometria/registrar', json({ llavePublica, dispositivo: 'Simulador' }, tokenVinculacion));
const fr = new FormData();
fr.append('foto', await foto(process.env.FOTO_REGISTRO), 'registro.jpg');
await pedir('/api/empleados/foto-registro', { method: 'POST', headers: { Authorization: `Bearer ${tokenVinculacion}` }, body: fr });

// 3. Check-in: reto -> firma -> selfie
const { retoId, reto } = await pedir(`/api/checkin/reto?empleadoId=${EMPLEADO_ID}`);
const firma = crypto.sign('RSA-SHA256', Buffer.from(reto), privateKey).toString('base64');
const fc = new FormData();
fc.append('empleadoId', String(EMPLEADO_ID));
fc.append('retoId', String(retoId));
fc.append('tipo', process.env.TIPO ?? 'entrada');
fc.append('firma', firma);
fc.append('idempotencyKey', crypto.randomUUID());
fc.append('selfie', await foto(process.env.SELFIE), 'selfie.jpg');
await pedir('/api/checkin', { method: 'POST', body: fc });

// 4. Estado de la TV
await pedir(`/api/tv/estado?token=${TV_TOKEN}`);
setTimeout(() => { tv.close(); process.exit(0); }, 500);
