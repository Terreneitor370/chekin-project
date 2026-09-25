// Estado del día + eventos en tiempo real.
// Al conectar o reconectar el socket se pide GET /api/tv/estado (recupera todo tras reinicios o cortes).
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, TV_TOKEN } from '../config';

export function useEstadoTv({ onCheckin }) {
  const [estado, setEstado] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState(null);
  const onCheckinRef = useRef(onCheckin);
  onCheckinRef.current = onCheckin;

  useEffect(() => {
    let cancelado = false;

    async function cargarEstado() {
      try {
        const r = await fetch(`${API_URL}/api/tv/estado?token=${encodeURIComponent(TV_TOKEN)}`);
        if (r.status === 401) throw new Error('Token de TV inválido. Revisa la URL (?token=...)');
        if (!r.ok) throw new Error(`Error ${r.status}`);
        const datos = await r.json();
        if (!cancelado) {
          setEstado(datos);
          setError(null);
        }
      } catch (e) {
        if (!cancelado) setError(e.message);
      }
    }

    cargarEstado();
    const socket = io(API_URL, { auth: { token: TV_TOKEN } });

    socket.on('connect', () => {
      setConectado(true);
      cargarEstado();
    });
    socket.on('disconnect', () => setConectado(false));
    socket.on('connect_error', () => setConectado(false));

    socket.on('nuevo-checkin', (evento) => {
      setEstado((prev) => {
        if (!prev) return prev;
        const llegaron = evento.tipo === 'entrada'
          ? [...prev.llegaron, { empleadoId: evento.empleadoId, nombre: evento.nombre, hora: evento.hora, tarde: evento.tarde, fotoUrl: evento.fotoUrl }]
          : prev.llegaron;
        return {
          ...prev,
          totales: evento.totales ?? prev.totales,
          llegaron,
          faltan: prev.faltan.filter((f) => f.empleadoId !== evento.empleadoId),
        };
      });
      onCheckinRef.current?.(evento);
    });
    socket.on('nuevo-aviso', ({ avisos }) => setEstado((prev) => (prev ? { ...prev, avisos } : prev)));
    socket.on('nuevo-multimedia', ({ multimedia }) => setEstado((prev) => (prev ? { ...prev, multimedia } : prev)));

    return () => {
      cancelado = true;
      socket.close();
    };
  }, []);

  return { estado, conectado, error };
}
