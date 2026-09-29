export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export function crearApi(obtenerToken, alExpirar) {
  async function pedir(method, path, data, { signal } = {}) {
    const token = obtenerToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    let body;
    if (data instanceof FormData) body = data;
    else if (data !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data); }
    let response;
    try { response = await fetch(`${API_URL}/api${path}`, { method, headers, body, signal }); }
    catch (error) { if (error.name === 'AbortError') throw error; throw new Error('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'); }
    if (response.status === 401 && token) alExpirar(token);
    const type = response.headers.get('content-type') || '';
    const result = response.status === 204 ? null : type.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new Error(result?.error?.mensaje || `No se pudo completar la solicitud (${response.status}).`);
    return result;
  }
  return { get: (path, options) => pedir('GET', path, undefined, options), post: (path, data, options) => pedir('POST', path, data, options), put: (path, data) => pedir('PUT', path, data), del: path => pedir('DELETE', path) };
}
