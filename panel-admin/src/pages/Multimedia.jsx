import { useEffect, useRef, useState } from 'react';
import { Upload, MonitorPlay, Film, Play, Power, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useSesion } from '../api/sesion';
import { DEMO_MODE } from '../api/demo';
import { API_URL } from '../api/client';
import { useCargar } from '../components/useCargar';
import { active } from '../components/data';
import { Alert, Badge, Button, Confirm, Empty, Field, Loading, Modal, PageHeader, useAction } from '../components/ui';
function UploadForm({ nextOrder, onClose, saved }) {
  const { api } = useSesion();
  const action = useAction();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const input = useRef(null);
  useEffect(() => { if (!file) { setPreview(''); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  function choose(candidate) { action.clearError(); setFile(candidate || null); }
  async function submit(e) {
    e.preventDefault(); const values = new FormData(e.currentTarget);
    await action.run(async () => {
      if (!file || !/\.mp4$/i.test(file.name) || (file.type && file.type !== 'video/mp4')) throw new Error('Selecciona un archivo de video MP4.');
      if (file.size === 0) throw new Error('El archivo está vacío.');
      const data = new FormData(); data.append('video', file); data.append('titulo', values.get('titulo').trim() || file.name); data.append('orden', String(nextOrder));
      await api.post('/multimedia', data); saved(); onClose();
    }, 'Video subido a la biblioteca.');
  }
  return <Modal title="Subir video" description="Agrega contenido a la programación de la TV." onClose={onClose} busy={action.busy}><form className="modal-form" onSubmit={submit}><div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!action.busy) choose(e.dataTransfer.files[0]); }}><Upload /><strong>{file ? file.name : 'Arrastra tu video aquí'}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · MP4` : 'Video MP4 · Recomendado: 1080p, H.264'}</span><input ref={input} type="file" accept="video/mp4,.mp4" aria-label="Archivo de video" disabled={action.busy} onChange={e => choose(e.target.files[0])} /></div>{preview && <video className="upload-preview" src={preview} controls muted playsInline preload="metadata" />}<Field label="Título del video"><input name="titulo" maxLength="160" placeholder="Ej. Bienvenida a nuestro equipo" required disabled={action.busy} /></Field><div className="info-note"><MonitorPlay /> La TV reproduce los videos activos en el orden de la lista.</div><Alert>{action.error}</Alert><div className="modal-actions"><Button variant="secondary" type="button" disabled={action.busy} onClick={onClose}>Cancelar</Button><Button busy={action.busy} disabled={!file}><Upload />{action.busy ? 'Subiendo video…' : 'Subir video'}</Button></div></form></Modal>;
}
function VideoPreview({ video, onClose }) {
  const [error, setError] = useState('');
  let url;
  try { const candidate = new URL(video.url, API_URL || window.location.origin); if (['http:', 'https:'].includes(candidate.protocol) || (DEMO_MODE && candidate.protocol === 'blob:')) url = candidate.href; } catch { /* render fallback */ }
  return <Modal title={video.titulo} description="Vista previa del contenido" onClose={onClose}><video className="video-preview" controls autoPlay muted playsInline src={url} onError={() => setError('No se pudo reproducir este video. Comprueba su disponibilidad y formato.')} /><Alert>{error || (!url ? 'El servidor no devolvió una URL de video válida.' : '')}</Alert></Modal>;
}
export default function Multimedia() {
  const { api } = useSesion();
  const { datos, error, loading, recargar } = useCargar(api, '/multimedia', 'multimedia');
  const [upload, setUpload] = useState(false);
  const [preview, setPreview] = useState(null);
  const [remove, setRemove] = useState(null);
  const action = useAction();
  const videos = [...(datos || [])].sort((a, b) => a.orden - b.orden || a.id - b.id);
  async function move(index, delta) {
    const reordered = [...videos]; [reordered[index], reordered[index + delta]] = [reordered[index + delta], reordered[index]];
    await action.run(async () => {
      try { for (let i = 0; i < reordered.length; i++) if (reordered[i].orden !== i + 1) await api.put(`/multimedia/${reordered[i].id}`, { orden: i + 1 }); }
      finally { await recargar(); }
    }, 'Orden de reproducción actualizado.');
  }
  return <><PageHeader eyebrow="PANTALLA INSTITUCIONAL" title="Dale vida a tu pantalla." description="Organiza los videos que acompañan el día de tu equipo."><Button onClick={() => setUpload(true)}><Upload />Subir video</Button></PageHeader><div className="media-overview"><div className="media-overview-art"><MonitorPlay /><div className="media-art-ring" /></div><div><span className="eyebrow">PROGRAMACIÓN DE LA TV</span><h2>Una pantalla. Muchas historias.</h2><p>Selecciona los videos activos y el orden de reproducción. Los cambios se sincronizan con la TV.</p><div className="flex gap-3"><Badge tone="green">{videos.filter(active).length} activos</Badge><Badge>{videos.length} en biblioteca</Badge></div></div></div><Alert retry={recargar}>{error}</Alert><Alert>{!remove && action.error}</Alert>{loading && !datos ? <Loading /> : !error && (videos.length ? <div className="video-grid">{videos.map((video, index) => <article className="video-card" key={video.id}><button className="video-art" onClick={() => setPreview(video)} aria-label={`Reproducir ${video.titulo}`}><Film /><span className="video-order">{String(index + 1).padStart(2, '0')}</span><span className="play-circle"><Play /></span><span className="video-format">MP4</span></button><div className="video-details"><div className="flex items-start justify-between gap-3"><h3>{video.titulo}</h3><Badge tone={active(video) ? 'green' : 'neutral'}>{active(video) ? 'Activo' : 'Pausado'}</Badge></div><p>Posición {video.orden} en la programación</p><div className="video-actions"><button className="icon-button" aria-label={`Mover arriba ${video.titulo}`} disabled={!index || action.busy} onClick={() => move(index, -1)}><ArrowUp /></button><button className="icon-button" aria-label={`Mover abajo ${video.titulo}`} disabled={index === videos.length - 1 || action.busy} onClick={() => move(index, 1)}><ArrowDown /></button><button className="btn btn-small btn-secondary" disabled={action.busy} onClick={async () => { if (await action.run(() => api.put(`/multimedia/${video.id}`, { activo: !active(video) }), 'Programación actualizada.')) recargar(); }}><Power />{active(video) ? 'Pausar' : 'Activar'}</button><button className="icon-button danger-text" aria-label={`Desactivar video ${video.titulo}`} disabled={action.busy} onClick={() => { action.clearError(); setRemove(video); }}><Trash2 /></button></div></div></article>)}</div> : <div className="card"><Empty title="Tu pantalla está lista para su primera historia" description="Sube un video MP4 para comenzar la programación."><Button onClick={() => setUpload(true)}><Upload />Subir primer video</Button></Empty></div>)}{upload && <UploadForm nextOrder={Math.max(0, ...videos.map(v => Number(v.orden) || 0)) + 1} onClose={() => setUpload(false)} saved={recargar} />}{preview && <VideoPreview video={preview} onClose={() => setPreview(null)} />}{remove && <Confirm title="Retirar video de la TV" description={`«${remove.titulo}» dejará de reproducirse en la pantalla.`} onClose={() => setRemove(null)} busy={action.busy} error={action.error} onConfirm={async () => { if (await action.run(() => api.del(`/multimedia/${remove.id}`), 'Video retirado.')) { setRemove(null); recargar(); } }} />}</>;
}
