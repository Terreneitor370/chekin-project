import axios from 'axios';
import { API_URL } from '../config';

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 30000 });

// Convierte cualquier error en un mensaje claro para el usuario (docs/api.md, formato de error).
export function mensajeDeError(error) {
  if (error?.response?.data?.error?.mensaje) return error.response.data.error.mensaje;
  if (error?.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Intenta de nuevo.';
  if (error?.message === 'Network Error') return 'Sin conexión con el servidor. Revisa tu internet.';
  return error?.message ?? 'Ocurrió un error inesperado.';
}

export function codigoDeError(error) {
  return error?.response?.data?.error?.codigo ?? null;
}
