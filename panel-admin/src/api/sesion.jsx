import { createContext, useContext, useMemo, useState } from 'react';
import { crearApi } from './client';
const SesionContext = createContext(null);
export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [expired, setExpired] = useState(false);
  const api = useMemo(() => crearApi(() => sesion?.token, token => {
    setSesion(current => {
      if (current?.token !== token) return current;
      setExpired(true);
      return null;
    });
  }), [sesion]);
  const login = data => {
    if (!data?.token || !['admin', 'supervisor'].includes(data.usuario?.rol)) throw new Error('Esta cuenta no tiene acceso al panel.');
    setExpired(false); setSesion(data);
  };
  return <SesionContext.Provider value={{ sesion, api, login, expired, salir: () => { setExpired(false); setSesion(null); } }}>{children}</SesionContext.Provider>;
}
export function useSesion() { return useContext(SesionContext); }
