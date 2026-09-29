import { useCallback, useEffect, useRef, useState } from 'react';
import { list } from './data';
export function useCargar(api, ruta, key = '') {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const controller = useRef(null);
  const recargar = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true); setError('');
    try {
      const result = await api.get(ruta, { signal: request.signal });
      if (!request.signal.aborted) setDatos(list(result, key));
    } catch (e) { if (!request.signal.aborted) setError(e.message); }
    finally { if (!request.signal.aborted) setLoading(false); }
  }, [api, ruta, key]);
  useEffect(() => { setDatos(null); recargar(); return () => controller.current?.abort(); }, [recargar]);
  return { datos, error, loading, recargar };
}
