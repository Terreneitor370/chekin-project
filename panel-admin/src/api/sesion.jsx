// Sesión del panel. El JWT se guarda SOLO en memoria (no en localStorage): al recargar se pide login.
import { createContext, useContext, useMemo, useState } from 'react';
import { crearApi } from './client';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(null); // { token, usuario }
  const api = useMemo(() => crearApi(() => sesion?.token, () => setSesion(null)), [sesion]);
  const valor = useMemo(() => ({ sesion, setSesion, api, salir: () => setSesion(null) }), [sesion, api]);
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  return useContext(SesionContext);
}
