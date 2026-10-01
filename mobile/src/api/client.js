import axios from 'axios';
import { API_URL } from '../config';

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 30000 });

// Mensajes para el usuario por código de error (docs/api.md, sección de errores).
// Dicen qué pasó y qué hacer; tienen prioridad sobre el mensaje técnico del servidor.
const MENSAJES_POR_CODIGO = {
  DATOS_INVALIDOS: 'Faltan datos o son incorrectos. Revisa la información e intenta de nuevo.',
  IMAGEN_INVALIDA: 'La foto no se pudo leer. Tómala de nuevo.',
  NO_AUTENTICADO: 'Tu sesión expiró. Vuelve a entrar.',
  FIRMA_INVALIDA: 'No pudimos validar tu huella. Usa la huella registrada en este teléfono.',
  RETO_INVALIDO: 'La verificación expiró. Toca "Intentar de nuevo" y pon tu huella otra vez.',
  SIN_PERMISO: 'Tu cuenta no tiene permiso para hacer esto.',
  ROSTRO_NO_COINCIDE: 'La iluminación es insuficiente o tu rostro no coincide con tu perfil registrado.',
  ROSTRO_NO_REAL: 'Detectamos una foto o una pantalla. Colócate frente a la cámara en persona.',
  NO_ENCONTRADO: 'No encontramos tu registro. Confirma tu código con Recursos Humanos.',
  DUPLICADO: 'Ya registraste tu asistencia hace unos minutos. Espera 5 minutos para volver a checar.',
  YA_REGISTRADO: 'Ya marcaste esto hoy. Solo se permite una vez al día.',
  SIN_ENTRADA: 'Primero marca tu entrada antes de marcar la salida.',
  SIN_ROSTRO: 'No vimos un rostro claro en la foto. Debe salir una sola persona, de frente y con buena luz.',
  DEMASIADAS_SOLICITUDES: 'Demasiados intentos seguidos. Espera un momento y vuelve a intentar.',
  SERVICIO_FACIAL_NO_DISPONIBLE: 'La verificación facial no está disponible ahora. Intenta de nuevo en unos minutos.',
};

// Convierte cualquier error en un mensaje claro para el usuario (docs/api.md, formato de error).
export function mensajeDeError(error) {
  const codigo = error?.response?.data?.error?.codigo;
  if (codigo && MENSAJES_POR_CODIGO[codigo]) return MENSAJES_POR_CODIGO[codigo];
  if (error?.response?.data?.error?.mensaje) return error.response.data.error.mensaje;
  if (error?.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Intenta de nuevo.';
  if (error?.message === 'Network Error') return 'Sin conexión con el servidor. Revisa tu internet.';
  return error?.message ?? 'Ocurrió un error inesperado.';
}

export function codigoDeError(error) {
  return error?.response?.data?.error?.codigo ?? null;
}
