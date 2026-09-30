// Máquina de estados de la TV: multimedia -> anuncio (cola, 4 s por persona) -> resumen (mínimo 15 s) -> multimedia.
// Corrige el temporizador del PDF: window.timer global que mostraba solo al último que checaba.
import { useCallback, useEffect, useRef, useState } from 'react';
import { TIEMPOS } from '../config';
import { summaryPages, SUMMARY_PAGE_MS } from '../summary';

export function useModoPantalla(estadoRef) {
  const [modo, setModoEstado] = useState('multimedia'); // multimedia | anuncio | resumen
  const [actual, setActual] = useState(null);
  const modoRef = useRef('multimedia');
  const cola = useRef([]);
  const timer = useRef(null);
  const source = useRef(estadoRef);
  source.current = estadoRef;
  const [resumenEstado, setResumenEstado] = useState(null);

  const setModo = (m) => {
    modoRef.current = m;
    setModoEstado(m);
  };

  const limpiar = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const siguiente = useCallback(() => {
    limpiar();
    const proximo = cola.current.shift();
    if (proximo) {
      setActual(proximo);
      setModo('anuncio');
      timer.current = setTimeout(siguiente, TIEMPOS.anuncioMs);
    } else {
      setActual(null);
      const snapshot = source.current?.current;
      setResumenEstado(snapshot);
      setModo('resumen');
      timer.current = setTimeout(() => setModo('multimedia'), Math.max(TIEMPOS.resumenMs, summaryPages(snapshot) * SUMMARY_PAGE_MS));
    }
  }, []);

  const encolar = useCallback((checkin) => {
    cola.current.push(checkin);
    // Si ya se anuncia a alguien, espera su turno; si no, empieza de inmediato
    if (modoRef.current !== 'anuncio') siguiente();
  }, [siguiente]);

  useEffect(() => limpiar, []);

  const reiniciar = useCallback(() => { limpiar(); cola.current = []; setActual(null); setModo('multimedia'); }, []);
  const mostrarResumen = useCallback(() => { cola.current = []; siguiente(); }, [siguiente]);
  return { modo, actual, encolar, resumenEstado, reiniciar, mostrarResumen };
}
