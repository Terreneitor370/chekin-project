import { useState } from 'react';
import { Megaphone, Plus, Pencil, Power, Trash2, Send, Monitor } from 'lucide-react';
import { useSesion } from '../api/sesion';
import { useCargar } from '../components/useCargar';
import { active, dateTime, localDate, toISO } from '../components/data';
import { Alert, Badge, Button, Confirm, DataTable, Field, Loading, Modal, PageHeader, useAction } from '../components/ui';

function NoticeForm({ notice, onClose, saved }) {
  const { api } = useSesion();
  const action = useAction();
  const [message, setMessage] = useState(notice?.mensaje || '');
  async function submit(e) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    await action.run(async () => {
      const fechaInicio = toISO(data.get('fechaInicio'));
      const fechaFin = toISO(data.get('fechaFin'));
      if (fechaInicio && fechaFin && fechaInicio >= fechaFin) throw new Error('La fecha final debe ser posterior al inicio.');
      if (!message.trim()) throw new Error('Escribe un mensaje para publicar.');
      const body = { mensaje: message.trim(), ...(fechaInicio && { fechaInicio }), ...(fechaFin && { fechaFin }) };
      await (notice ? api.put(`/avisos/${notice.id}`, body) : api.post('/avisos', body)); saved(); onClose();
    }, notice ? 'Aviso actualizado.' : 'Aviso publicado.');
  }
  return <Modal title={notice ? 'Editar aviso' : 'Nuevo aviso'} description="Un mensaje para todo tu equipo, en la pantalla de la TV." onClose={onClose} busy={action.busy}><form className="modal-form" onSubmit={submit}><Field label="Mensaje"><textarea rows="3" maxLength="255" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ej. Reunión de equipo hoy a las 3:00 pm." required /></Field><span className="char-count">{message.length} / 255</span><div className="form-grid"><Field label="Inicio (opcional)"><input name="fechaInicio" type="datetime-local" defaultValue={localDate(notice?.fechaInicio)} required={!!notice?.fechaInicio} /></Field><Field label="Fin (opcional)"><input name="fechaFin" type="datetime-local" defaultValue={localDate(notice?.fechaFin)} required={!!notice?.fechaFin} /></Field></div><p className="subtle">Horario de Hermosillo. Sin fechas, el aviso estará disponible al publicarse.{notice && ' Puedes cambiar las fechas existentes; para retirarlo usa Pausar.'}</p><div className="preview-label"><Monitor /> VISTA PREVIA EN TV</div><div className="ticker-preview"><Megaphone /><span>{message || 'Tu próximo mensaje aparecerá aquí.'}</span></div><Alert>{action.error}</Alert><div className="modal-actions"><Button variant="secondary" type="button" onClick={onClose} disabled={action.busy}>Cancelar</Button><Button busy={action.busy}><Send />{notice ? 'Guardar cambios' : 'Publicar aviso'}</Button></div></form></Modal>;
}
export default function Avisos() {
  const { api } = useSesion();
  const { datos, loading, error, recargar } = useCargar(api, '/avisos', 'avisos');
  const [editor, setEditor] = useState(null);
  const [remove, setRemove] = useState(null);
  const action = useAction();
  const notices = datos || [];
  const status = n => !active(n) ? 'Pausado' : n.fechaFin && Date.parse(n.fechaFin) < Date.now() ? 'Finalizado' : n.fechaInicio && Date.parse(n.fechaInicio) > Date.now() ? 'Programado' : 'Publicado';
  return <><PageHeader eyebrow="COMUNICACIÓN INTERNA" title="Mensajes que nos conectan." description="Publica y programa los avisos del ticker de la TV."><Button onClick={() => setEditor({})}><Plus />Nuevo aviso</Button></PageHeader><div className="feature-banner"><span className="feature-icon"><Megaphone /></span><div><h2>Tu voz, en cada pantalla.</h2><p>Comparte recordatorios, novedades y buenos momentos con todo el equipo.</p></div><Badge tone="green">{notices.filter(n => status(n) === 'Publicado').length} publicados</Badge></div><Alert retry={recargar}>{error}</Alert><Alert>{!remove && action.error}</Alert>{loading && !datos ? <Loading /> : !error && <DataTable rows={notices} searchBy={n => n.mensaje} searchPlaceholder="Buscar aviso…" emptyTitle="Hay mucho por compartir" emptyDescription="Publica tu primer aviso y acompaña el día de tu equipo." columns={[{ key: 'mensaje', title: 'Mensaje', render: n => <div className="notice-message"><Megaphone /><span>{n.mensaje}</span></div> }, { key: 'fechas', title: 'Programación', render: n => <div className="stack"><span>{n.fechaInicio ? dateTime(n.fechaInicio) : 'Desde su publicación'}</span><small>{n.fechaFin ? `Hasta ${dateTime(n.fechaFin)}` : 'Sin fecha de fin'}</small></div> }, { key: 'estado', title: 'Estado', render: n => <Badge tone={status(n) === 'Publicado' ? 'green' : status(n) === 'Programado' ? 'blue' : 'neutral'}>{status(n)}</Badge> }, { key: 'acciones', title: 'Acciones', render: n => <div className="row-actions"><button className="icon-button" aria-label={`Editar aviso ${n.id}`} onClick={() => setEditor(n)}><Pencil /></button><button disabled={action.busy} className="btn btn-small btn-secondary" onClick={async () => { if (await action.run(() => api.put(`/avisos/${n.id}`, { activo: !active(n) }), 'Estado del aviso actualizado.')) recargar(); }}><Power />{active(n) ? 'Pausar' : 'Activar'}</button><button className="icon-button danger-text" aria-label={`Desactivar aviso ${n.id}`} disabled={action.busy} onClick={() => { action.clearError(); setRemove(n); }}><Trash2 /></button></div> }]} />}{editor && <NoticeForm notice={editor.id ? editor : null} onClose={() => setEditor(null)} saved={recargar} />}{remove && <Confirm title="Retirar aviso" description="El aviso dejará de estar activo en la TV." onClose={() => setRemove(null)} busy={action.busy} error={action.error} onConfirm={async () => { if (await action.run(() => api.del(`/avisos/${remove.id}`), 'Aviso retirado.')) { setRemove(null); recargar(); } }} />}</>;
}
