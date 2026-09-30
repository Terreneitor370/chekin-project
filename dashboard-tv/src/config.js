// La TV abre: https://<dominio>/tv/?token=<TV_TOKEN>
const params = new URLSearchParams(window.location.search);

export const TV_TOKEN = params.get('token') ?? '';
export const DEMO_MODE = import.meta.env.DEV && params.get('demo') === '1';
export const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const TIEMPOS = {
  anuncioMs: 4000, // cada persona en pantalla (cola)
  resumenMs: 15000, // mínimo; se extiende para mostrar todas las páginas
};

// Agrega el token de la TV a las URLs de fotos protegidas
export function urlConToken(ruta) {
  if (!ruta) return null;
  try {
    const url = new URL(ruta, API_URL);
    if (DEMO_MODE && url.protocol === 'blob:') return url.href;
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.origin === new URL(API_URL).origin && !url.searchParams.has('token')) url.searchParams.set('token', TV_TOKEN);
    return url.href;
  } catch { return null; }
}
