import { useEffect, useRef, useState } from 'react';
import { summaryPages, SUMMARY_PAGE_MS } from '../summary';
const hora = iso => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Hermosillo' });
export default function ModoResumen({ estado }) {
  const [page, setPage] = useState(0);
  const timer = useRef(null);
  const pages = summaryPages(estado);
  useEffect(() => {
    timer.current = setInterval(() => setPage(p => (p + 1) % pages), SUMMARY_PAGE_MS);
    return () => clearInterval(timer.current);
  }, [pages]);
  if (!estado) return null;
  const start = (page % pages) * 5;
  return <div className="resumen"><div className="eyebrow">RESUMEN DE HOY · {estado.totales.tardanzas} TARDANZAS</div><div className="columnas"><section><h2>Llegaron · {estado.llegaron.length}</h2>{estado.llegaron.slice(start, start + 5).map(p => <div className={`fila ${p.tarde ? 'tarde' : ''}`} key={p.empleadoId}><span>{p.nombre}{p.tarde ? ' · Tarde' : ''}</span><time>{hora(p.hora)}</time></div>)}{!estado.llegaron.length && <p className="muted">El primer registro está por llegar.</p>}</section><section><h2>Pendientes · {estado.faltan.length}</h2>{estado.faltan.slice(start, start + 5).map(p => <div className="fila" key={p.empleadoId}><span>{p.nombre}</span></div>)}{!estado.faltan.length && <p className="muted">Todo el equipo ha registrado su asistencia.</p>}</section></div><div className="summary-page">Página {page % pages + 1} de {pages} · Actualización en vivo</div></div>;
}
