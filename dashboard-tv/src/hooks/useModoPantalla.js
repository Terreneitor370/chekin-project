// Máquina de estados de la TV: multimedia -> anuncio (cola, 4 s por persona) -> resumen (15 s) -> multimedia.
// Corrige el temporizador del PDF: window.timer global que mostraba solo al último que checaba.
import { useCallback, useEffect, useRef, useState } from 'react';
import { TIEMPOS } from '../config';

export function useModoPantalla() {
  const [modo, setModoEstado] = useState('multimedia'); // multimedia | anuncio | resumen
  const [actual, setActual] = useState(null);
  const modoRef = useRef('multimedia');
  const cola = useRef([]);
  const timer = useRef(null);

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
      setModo('resumen');
      timer.current = setTimeout(() => setModo('multimedia'), TIEMPOS.resumenMs);
    }
  }, []);

  const encolar = useCallback((checkin) => {
    cola.current.push(checkin);
    // Si ya se anuncia a alguien, espera su turno; si no, empieza de inmediato
    if (modoRef.current !== 'anuncio') siguiente();
  }, [siguiente]);

  useEffect(() => limpiar, []);

  return { modo, actual, encolar };
}
