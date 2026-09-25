import { useCallback, useEffect, useState } from 'react';

// Carga datos de una ruta del API y expone recargar() para después de crear/editar.
export function useCargar(api, ruta) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const recargar = useCallback(async () => {
    try {
      setDatos(await api.get(ruta));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [api, ruta]);
  useEffect(() => { recargar(); }, [recargar]);
  return { datos, error, recargar };
}
