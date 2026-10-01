import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { crearApi } from './client';
import { DEMO_MODE, createDemoApi, demoSession } from './demo';
const SesionContext = createContext(null);
export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(() => DEMO_MODE && !window.location.pathname.endsWith('/login') ? demoSession() : null);
  const [expired, setExpired] = useState(false);
  const sessionRef = useRef(sesion);
  sessionRef.current = sesion;
  const [demoApi] = useState(() => DEMO_MODE ? createDemoApi(() => sessionRef.current?.usuario.rol) : null);
  useEffect(() => () => demoApi?.dispose(), [demoApi]);
  const api = useMemo(() => demoApi || crearApi(() => sesion?.token, token => {
    setSesion(current => {
      if (current?.token !== token) return current;
      setExpired(true);
      return null;
    });
  }), [sesion, demoApi]);
  const login = data => {
    if (!data?.token || !['admin', 'supervisor'].includes(data.usuario?.rol)) throw new Error('Esta cuenta no tiene acceso al panel.');
    setExpired(false); setSesion(data);
  };
  return <SesionContext.Provider value={{ sesion, api, login, expired, cambiarRolDemo: rol => { if (DEMO_MODE) setSesion(demoSession(rol)); }, salir: () => { setExpired(false); setSesion(null); } }}>{children}</SesionContext.Provider>;
}
export function useSesion() { return useContext(SesionContext); }
