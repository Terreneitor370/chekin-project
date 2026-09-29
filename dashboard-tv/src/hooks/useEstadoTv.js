import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, TV_TOKEN } from '../config';

export function useEstadoTv({ onCheckin }) {
  const [estado, setEstado] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState(null);
  const onCheckinRef = useRef(onCheckin);
  const retry = useRef(null);
  const refresh = useRef(null);
  const deadline = useRef(null);
  onCheckinRef.current = onCheckin;

  useEffect(() => {
    if (!TV_TOKEN) { setError('token'); return; }
    let disposed = false;
    let controller;
    let pending = null;
    let current = null;
    const seen = new Set();
    const socket = io(API_URL, { auth: { token: TV_TOKEN }, autoConnect: false, reconnectionDelayMax: 10000 });
    const publish = next => { current = next; setEstado(next); };
    const apply = (base, type, data) => {
      if (type === 'avisos') return { ...base, avisos: data };
      if (type === 'multimedia') return { ...base, multimedia: data };
      const llegaron = data.tipo === 'entrada'
        ? [...base.llegaron.filter(p => p.empleadoId !== data.empleadoId), { empleadoId: data.empleadoId, nombre: data.nombre, hora: data.hora, tarde: data.tarde, fotoUrl: data.fotoUrl }]
        : base.llegaron;
      return { ...base, llegaron, totales: data.totales ?? base.totales, faltan: base.faltan.filter(p => p.empleadoId !== data.empleadoId) };
    };
    async function sync() {
      clearTimeout(retry.current);
      clearTimeout(deadline.current);
      controller?.abort();
      const request = new AbortController();
      controller = request;
      // Replay socket changes received while the snapshot was in flight.
      const changes = [];
      pending = changes;
      deadline.current = setTimeout(() => request.abort(), 12000);
      try {
        const response = await fetch(`${API_URL}/api/tv/estado?token=${encodeURIComponent(TV_TOKEN)}`, { signal: request.signal, cache: 'no-store' });
        if (response.status === 401 || response.status === 403) throw new Error('token');
        if (!response.ok) throw new Error('network');
        let data = await response.json();
        if (!data.totales || !['llegaron', 'faltan', 'avisos', 'multimedia'].every(key => Array.isArray(data[key]))) throw new Error('network');
        if (disposed || controller !== request) return;
        for (const [type, value] of changes) data = apply(data, type, value);
        publish(data);
        setError(null);
      } catch (e) {
        if (disposed || controller !== request) return;
        setError(e.message === 'token' ? 'token' : 'network');
        retry.current = setTimeout(sync, 10000);
      } finally {
        if (controller === request) { clearTimeout(deadline.current); pending = null; }
      }
    }
    const receive = (type, data) => {
      if (pending) pending.push([type, data]);
      if (current) publish(apply(current, type, data));
    };
    socket.on('connect', () => { setConectado(true); sync(); });
    socket.on('disconnect', () => setConectado(false));
    socket.on('connect_error', () => setConectado(false));
    socket.on('nuevo-checkin', event => {
      if (!event || event.checkinId == null || !event.nombre || !['entrada', 'salida'].includes(event.tipo) || !Number.isFinite(Date.parse(event.hora))) return;
      if (seen.has(event.checkinId)) return;
      seen.add(event.checkinId);
      if (seen.size > 1000) seen.delete(seen.values().next().value);
      receive('checkin', event);
      onCheckinRef.current?.(event);
    });
    socket.on('nuevo-aviso', data => { if (Array.isArray(data?.avisos)) receive('avisos', data.avisos); });
    socket.on('nuevo-multimedia', data => { if (Array.isArray(data?.multimedia)) receive('multimedia', data.multimedia); });
    sync();
    socket.connect();
    // Refresh the date after midnight even if no socket event arrives.
    refresh.current = setInterval(() => {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Hermosillo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (current && current.fecha !== today && !pending) sync();
    }, 60000);
    return () => {
      disposed = true;
      controller?.abort();
      clearTimeout(retry.current);
      clearTimeout(deadline.current);
      clearInterval(refresh.current);
      socket.removeAllListeners();
      socket.close();
    };
  }, []);
  return { estado, conectado, error };
}
