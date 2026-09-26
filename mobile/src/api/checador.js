// Llamadas al backend según docs/api.md. Si cambia el contrato, cambia aquí y en docs/api.md.
import { api } from './client';

// POST /api/dispositivos/vincular
export async function vincular(codigo) {
  const { data } = await api.post('/dispositivos/vincular', { codigo });
  return data; // { tokenVinculacion, empleado: { id, nombre } }
}

// POST /api/biometria/registrar  (la huella como dato: llave pública ligada al usuario)
export async function registrarLlave(tokenVinculacion, llavePublica, dispositivo) {
  const { data } = await api.post(
    '/biometria/registrar',
    { llavePublica, dispositivo },
    { headers: { Authorization: `Bearer ${tokenVinculacion}` } },
  );
  return data; // { huellaId, empleadoId }
}

// POST /api/empleados/foto-registro  (multipart: foto)
export async function subirFotoRegistro(tokenVinculacion, fotoUri) {
  const form = new FormData();
  form.append('foto', { uri: fotoUri, name: 'registro.jpg', type: 'image/jpeg' });
  const { data } = await api.post('/empleados/foto-registro', form, {
    headers: { Authorization: `Bearer ${tokenVinculacion}`, 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}

// GET /api/checkin/reto
export async function pedirReto(empleadoId) {
  const { data } = await api.get('/checkin/reto', { params: { empleadoId } });
  return data; // { retoId, reto, expiraEn }
}

// POST /api/checkin  (multipart: empleadoId, retoId, firma, idempotencyKey, selfie)
export async function enviarCheckin({ empleadoId, retoId, firma, idempotencyKey, selfieUri }) {
  const form = new FormData();
  form.append('empleadoId', String(empleadoId));
  form.append('retoId', String(retoId));
  form.append('firma', firma);
  form.append('idempotencyKey', idempotencyKey);
  form.append('selfie', { uri: selfieUri, name: 'selfie.jpg', type: 'image/jpeg' });
  const { data } = await api.post('/checkin', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // DeepFace en CPU puede tardar varios segundos
  });
  return data; // { checkin, empleado, verificacion }
}

// POST /api/mi/sesion  (firma con la huella -> token de empleado para "Mi asistencia")
export async function abrirSesionEmpleado({ empleadoId, retoId, firma }) {
  const { data } = await api.post('/mi/sesion', { empleadoId, retoId, firma });
  return data; // { tokenEmpleado, empleado }
}

// GET /api/mi/asistencia  (rol empleado: solo sus propios registros)
export async function miAsistencia(tokenEmpleado, { desde, hasta } = {}) {
  const { data } = await api.get('/mi/asistencia', {
    params: { desde, hasta },
    headers: { Authorization: `Bearer ${tokenEmpleado}` },
  });
  return data; // { empleado, hoy, totales, registros }
}
