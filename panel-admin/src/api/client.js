export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const REQUEST_TIMEOUT_MS = 20000;
export const UPLOAD_TIMEOUT_MS = 120000;

export function crearApi(obtenerToken, alExpirar) {
  async function pedir(method, path, data, { signal, timeoutMs } = {}) {
    const token = obtenerToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const upload = data instanceof FormData;
    let body;
    if (upload) body = data;
    else if (data !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data); }
    const controller = new AbortController();
    const cancel = () => controller.abort();
    let timedOut = false;
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs ?? (upload ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS));
    try {
      let response;
      try { response = await fetch(`${API_URL}/api${path}`, { method, headers, body, signal: controller.signal }); }
      catch (error) {
        if (controller.signal.aborted) throw error;
        throw new Error('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
      }
      if (response.status === 401 && token) alExpirar(token);
      const type = response.headers.get('content-type') || '';
      const result = response.status === 204 ? null : type.includes('application/json') ? await response.json() : await response.text();
      if (!response.ok) throw new Error(result?.error?.mensaje || `No se pudo completar la solicitud (${response.status}).`);
      return result;
    } catch (error) {
      if (timedOut) throw new Error(method === 'GET'
        ? 'El servidor tardó demasiado. Intenta consultar de nuevo.'
        : 'El servidor tardó demasiado. Cierra este formulario y actualiza la lista para comprobar si se guardó antes de repetir la operación.');
      throw error;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
  }
  return {
    get: (path, options) => pedir('GET', path, undefined, options),
    post: (path, data, options) => pedir('POST', path, data, options),
    put: (path, data, options) => pedir('PUT', path, data, options),
    del: (path, options) => pedir('DELETE', path, undefined, options),
  };
}
