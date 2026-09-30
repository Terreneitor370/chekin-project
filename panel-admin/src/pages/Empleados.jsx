import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, UserRoundMinus, UserRoundCheck, Fingerprint, KeyRound, Copy, Users, ShieldCheck, Clock3 } from 'lucide-react';
import { useSesion } from '../api/sesion';
import { useCargar } from '../components/useCargar';
import { active, yes, dateTime } from '../components/data';
import { Alert, Badge, Button, Confirm, DataTable, Field, Loading, Modal, PageHeader, Person, Stat, useAction } from '../components/ui';

const NAME_PATTERN = String.raw`(?:\p{L}\p{M}*\. |\p{L}[\p{L}\p{M}]*[ '’\-])*\p{L}[\p{L}\p{M}]*`;

function EmployeeForm({ employee, onClose, saved }) {
  const { api } = useSesion();
  const action = useAction();
  const [nameInvalid, setNameInvalid] = useState(false);
  const [toleranceInvalid, setToleranceInvalid] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    const form = new FormData(e.currentTarget);
    const body = { nombre: form.get('nombre').trim(), email: form.get('email').trim(), horaEntrada: form.get('horaEntrada'), toleranciaMin: Number(form.get('toleranciaMin')) };
    if (!body.nombre) return;
    const ok = await action.run(() => employee ? api.put(`/empleados/${employee.id}`, body) : api.post('/empleados', body), employee ? 'Empleado actualizado.' : 'Empleado registrado.');
    if (ok) { saved(); onClose(); }
  }
  return <Modal title={employee ? 'Editar empleado' : 'Nuevo empleado'} description="Configura sus datos y horario de entrada." onClose={onClose} busy={action.busy}><form onSubmit={submit} className="modal-form"><Field label="Nombre completo" hint="Letras, acentos, espacios simples, apóstrofos, guiones e iniciales como E."><input name="nombre" defaultValue={employee?.nombre} required maxLength={160} pattern={NAME_PATTERN} title="Ejemplos: Jeshua E. Pérez, María-José Sánchez, O'Brien Ángel. Sin números, símbolos, espacios dobles ni punto o guion al final." aria-invalid={nameInvalid} onChange={e => setNameInvalid(!e.currentTarget.validity.valid)} /></Field><Alert>{nameInvalid && "Escribe un nombre válido, sin números ni símbolos, sin espacios dobles y sin terminar en punto o guion."}</Alert><Field label="Correo electrónico"><input name="email" type="email" defaultValue={employee?.email} required /></Field><div className="form-grid"><Field label="Hora de entrada"><input type="time" name="horaEntrada" defaultValue={employee?.horaEntrada?.slice(0, 5) || '08:00'} required /></Field><Field label="Tolerancia (minutos)" hint="De 0 a 20 minutos."><input type="number" name="toleranciaMin" min="0" max="20" step="1" defaultValue={employee?.toleranciaMin ?? 10} required aria-invalid={toleranceInvalid} onChange={e => setToleranceInvalid(!e.currentTarget.validity.valid)} /></Field></div><Alert>{toleranceInvalid && "La tolerancia debe ser un número entero entre 0 y 20 minutos."}</Alert><div className="info-note"><Clock3 /> El horario se interpreta en Hermosillo, Sonora.</div><Alert>{action.error}</Alert><div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={action.busy}>Cancelar</Button><Button busy={action.busy}>Guardar empleado</Button></div></form></Modal>;
}
function LinkingCode({ employee, onClose }) {
  const { api } = useSesion();
  const action = useAction();
  const [code, setCode] = useState(null);
  const [now, setNow] = useState(Date.now());
  const timer = useRef(null);
  useEffect(() => { timer.current = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer.current); }, []);
  const remaining = code ? Math.max(0, Math.ceil((Date.parse(code.expiraEn) - now) / 1000)) : 0;
  const expired = code && remaining === 0;
  async function generate() {
    await action.run(async () => {
      const result = await api.post(`/empleados/${employee.id}/codigo`);
      if (!/^\d{6}$/.test(String(result.codigo)) || !Number.isFinite(Date.parse(result.expiraEn))) throw new Error('El servidor no devolvió un código válido.');
      setCode(result); setNow(Date.now());
    });
  }
  return <Modal title="Vincular dispositivo" description={employee.nombre} onClose={onClose} busy={action.busy}><div className="linking-intro"><span><Fingerprint /></span><h3>Su asistencia empieza aquí.</h3><p>Comparte el código con el empleado para registrar su teléfono, huella y rostro desde la app.</p></div>{code && <><div className={`linking-code ${expired ? 'expired' : ''}`} aria-label="Código de vinculación">{expired ? '••••••' : String(code.codigo)}</div><p className="code-expiry">{expired ? 'Este código expiró. Genera uno nuevo.' : `Vigente por ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} · Un solo uso`}</p><p className="subtle text-center">Vence: {dateTime(code.expiraEn)}</p></>}<Alert>{action.error}</Alert><div className="modal-actions"><Button variant="secondary" onClick={onClose} disabled={action.busy}>Cerrar</Button>{code && !expired ? <Button busy={action.busy} onClick={() => action.run(() => navigator.clipboard.writeText(String(code.codigo)), 'Código copiado.')}><Copy />Copiar código</Button> : <Button busy={action.busy} onClick={generate}><KeyRound />{code ? 'Generar nuevo código' : 'Generar código'}</Button>}</div></Modal>;
}
export default function Empleados() {
  const { api, sesion } = useSesion();
  const admin = sesion.usuario.rol === 'admin';
  const { datos, error, loading, recargar } = useCargar(api, '/empleados', 'empleados');
  const [editor, setEditor] = useState(null);
  const [link, setLink] = useState(null);
  const [remove, setRemove] = useState(null);
  const [filter, setFilter] = useState('all');
  const action = useAction();
  const rows = datos || [];
  const ready = rows.filter(e => yes(e.tieneHuella) && yes(e.tieneFoto));
  const columns = [
    { key: 'nombre', title: 'Empleado', render: e => <Person name={e.nombre} subtitle={e.email} /> },
    { key: 'horario', title: 'Horario', render: e => <div className="stack"><strong>{e.horaEntrada?.slice(0, 5) || '—'}</strong><small>{e.toleranciaMin ?? '—'} min de tolerancia</small></div> },
    { key: 'biometria', title: 'Vinculación', render: e => <div className="stack"><Badge tone={yes(e.tieneHuella) && yes(e.tieneFoto) ? 'green' : 'amber'}>{yes(e.tieneHuella) && yes(e.tieneFoto) ? 'Vinculado' : 'Pendiente'}</Badge><small>Huella {yes(e.tieneHuella) ? '✓' : '—'} · Rostro {yes(e.tieneFoto) ? '✓' : '—'}</small></div> },
    { key: 'estado', title: 'Estado', render: e => <Badge tone={active(e) ? 'green' : 'neutral'}>{active(e) ? 'Activo' : 'Inactivo'}</Badge> },
    { key: 'acciones', title: 'Acciones', render: e => <div className="row-actions"><button className="icon-button" aria-label={`Editar a ${e.nombre}`} onClick={() => setEditor(e)}><Pencil /></button>{admin && active(e) && <><button className="btn btn-small btn-secondary" onClick={() => setLink(e)}><KeyRound />Vincular</button><button className="icon-button danger-text" aria-label={`Desactivar a ${e.nombre}`} onClick={() => { action.clearError(); setRemove(e); }}><UserRoundMinus /></button></>}{admin && !active(e) && <Button variant="secondary" className="btn-small" busy={action.busy} aria-label={`Activar a ${e.nombre}`} onClick={async () => { if (await action.run(() => api.put(`/empleados/${e.id}`, { activo: true }), "Empleado reactivado.")) recargar(); }}><UserRoundCheck />Activar</Button>}</div> },
  ];
  return <><PageHeader title="Tu equipo, en un solo lugar." description="Administra empleados, horarios y vinculación biométrica.">{admin && <Button onClick={() => setEditor({})}><Plus />Nuevo empleado</Button>}</PageHeader><div className="stats-grid three"><Stat icon={Users} label="Empleados activos" value={datos ? rows.filter(active).length : '—'} detail="Personas en tu organización" /><Stat icon={ShieldCheck} label="Identidad vinculada" value={datos ? ready.length : '—'} detail="Huella y rostro registrados" tone="mint" /><Stat icon={Fingerprint} label="Por vincular" value={datos ? rows.filter(active).filter(e => !yes(e.tieneHuella) || !yes(e.tieneFoto)).length : '—'} detail="Pendientes de completar su registro" /></div><Alert retry={recargar}>{error}</Alert><Alert>{!remove && action.error}</Alert>{loading && !datos ? <Loading /> : !error && <DataTable rows={rows.filter(e => filter === 'all' || (filter === 'active' ? active(e) : !active(e)))} columns={columns} searchBy={e => `${e.nombre} ${e.email || ''}`} searchPlaceholder="Buscar empleado o correo…" filters={<select aria-label="Filtrar estado" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select>} emptyTitle="Tu equipo empieza aquí" emptyDescription={admin ? 'Agrega el primer empleado para comenzar.' : 'Los empleados aparecerán cuando el administrador los registre.'} />}{editor && <EmployeeForm employee={editor.id ? editor : null} onClose={() => setEditor(null)} saved={recargar} />}{link && <LinkingCode employee={link} onClose={() => setLink(null)} />}{remove && <Confirm title={`Desactivar a ${remove.nombre}`} description="Ya no podrá registrar asistencia. Su historial se conservará." onClose={() => setRemove(null)} busy={action.busy} error={action.error} onConfirm={async () => { if (await action.run(() => api.del(`/empleados/${remove.id}`), 'Empleado desactivado.')) { setRemove(null); recargar(); } }} />}</>;
}
