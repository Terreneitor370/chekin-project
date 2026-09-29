import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Play, Fingerprint } from 'lucide-react';
import { urlConToken } from '../config';

export default function ModoMultimedia({ estado, visible }) {
  const lista = [...(estado?.multimedia ?? [])].sort((a, b) => a.orden - b.orden);
  const [indice, setIndice] = useState(0);
  const [failed, setFailed] = useState([]);
  const player = useRef(null);
  const signature = JSON.stringify(lista);
  useEffect(() => { setIndice(0); setFailed([]); }, [signature]);
  const available = lista.filter(item => !failed.includes(item.id));
  const video = available[indice % available.length];
  useEffect(() => {
    if (!player.current) return;
    if (visible) player.current.play()?.catch(error => {
      // Pausing for a check-in may cancel an outstanding play request.
      if (error.name !== 'AbortError') setFailed(ids => ids.includes(video.id) ? ids : [...ids, video.id]);
    });
    else player.current.pause();
  }, [visible, video?.id]);
  return <div className="media-panel" style={{ display: visible ? 'block' : 'none' }}>
    {video ? <video ref={player} key={video.id} src={urlConToken(video.url)} autoPlay muted playsInline loop={available.length === 1} preload="metadata" onEnded={() => setIndice(i => i + 1)} onError={() => setFailed(ids => ids.includes(video.id) ? ids : [...ids, video.id])} /> : <div className="institutional-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-orbit orbit-three" /><Fingerprint className="art-fingerprint" /><div className="hero-copy"><span className="eyebrow">CONECTADOS EN CADA PASO</span><h1>Un gran día<br />empieza contigo<span>.</span></h1><p>Bienvenido a tu espacio de trabajo.</p><div className="hero-rule" /></div></div>}
    <div className="media-top"><span className="media-label"><span className="status-dot" /> NUESTRO ESPACIO</span><ArrowUpRight /></div>
    <div className="media-bottom"><span className="flex items-center gap-3"><Play /> {video?.titulo || (failed.length ? 'Contenido no disponible' : 'Bienvenido a Checker')}</span><span>{video ? `${String(indice % available.length + 1).padStart(2, '0')} / ${String(available.length).padStart(2, '0')}` : 'Juntos, cada día'}</span></div>
  </div>;
}
