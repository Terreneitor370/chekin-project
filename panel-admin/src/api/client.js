// Cliente del API según docs/api.md. Maneja el formato de error { error: { codigo, mensaje } }.
export const API_URL = import.meta.env.VITE_API_URL || '';

export function crearApi(obtenerToken, alExpirar) {
  async function pedir(metodo, ruta, cuerpo) {
    const headers = {};
    const token = obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let body;
    if (cuerpo instanceof FormData) body = cuerpo;
    else if (cuerpo !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(cuerpo);
    }
    const r = await fetch(`${API_URL}/api${ruta}`, { method: metodo, headers, body });
    if (r.status === 401 && token) alExpirar();
    const tipo = r.headers.get('content-type') ?? '';
    const datos = tipo.includes('application/json') ? await r.json() : await r.text();
    if (!r.ok) throw new Error(datos?.error?.mensaje ?? `Error ${r.status}`);
    return datos;
  }
  return {
    get: (ruta) => pedir('GET', ruta),
    post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
    put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
    del: (ruta) => pedir('DELETE', ruta),
  };
}
