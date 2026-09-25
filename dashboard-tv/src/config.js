// La TV abre: https://<dominio>/tv/?token=<TV_TOKEN>
const params = new URLSearchParams(window.location.search);

export const TV_TOKEN = params.get('token') ?? '';
export const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const TIEMPOS = {
  anuncioMs: 4000, // cada persona en pantalla (cola)
  resumenMs: 15000, // PDF: vuelve a multimedia después de 15 s
};

// Agrega el token de la TV a las URLs de fotos protegidas
export function urlConToken(ruta) {
  if (!ruta) return null;
  const sep = ruta.includes('?') ? '&' : '?';
  return `${API_URL}${ruta}${ruta.includes('token=') ? '' : `${sep}token=${encodeURIComponent(TV_TOKEN)}`}`;
}
