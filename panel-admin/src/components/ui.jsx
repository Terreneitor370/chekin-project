import { Children, cloneElement, isValidElement, createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Inbox, LoaderCircle, Search, X } from 'lucide-react';

const NoticeContext = createContext(() => {});
export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);
  const notify = message => { clearTimeout(timer.current); setNotice(message); timer.current = setTimeout(() => setNotice(null), 5000); };
  useEffect(() => () => clearTimeout(timer.current), []);
  return <NoticeContext.Provider value={notify}>{children}{notice && <div role="status" className="toast"><CheckCircle2 />{notice}<button aria-label="Cerrar notificación" onClick={() => setNotice(null)}><X /></button></div>}</NoticeContext.Provider>;
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const notify = useContext(NoticeContext);
  async function run(fn, message) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    try { await fn(); if (message) notify(message); return true; }
    catch (e) { setError(e.message || 'No se pudo completar la operación.'); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  return { busy, error, run, clearError: () => setError('') };
}
export function Button({ children, variant = 'primary', busy, className = '', ...props }) {
  return <button className={`btn btn-${variant} ${className}`} {...props} disabled={props.disabled || busy}>{busy && <LoaderCircle className="spin" />}{children}</button>;
}
export function Badge({ children, tone = 'neutral' }) { return <span className={`badge badge-${tone}`}><i />{children}</span>; }
export function Avatar({ name = '' }) { return <span className="avatar" aria-hidden="true">{name.trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase() || '—'}</span>; }
export function Person({ name, subtitle }) { return <div className="person"><Avatar name={name} /><div><strong>{name}</strong>{subtitle && <span>{subtitle}</span>}</div></div>; }
export function PageHeader({ eyebrow = 'ESPACIO DE TRABAJO', title, description, children }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{children}</div></div>; }
export function Alert({ children, retry }) { return children ? <div role="alert" className="alert"><AlertCircle /><span>{children}</span>{retry && <button onClick={retry}>Reintentar</button>}</div> : null; }
export function Empty({ title = 'Aún no hay registros', description = 'Los nuevos registros aparecerán aquí.', children }) { return <div className="empty"><span className="empty-icon"><Inbox /></span><h3>{title}</h3><p>{description}</p>{children}</div>; }
export function Loading() { return <div className="loading" role="status"><LoaderCircle className="spin" /> Cargando información…</div>; }
export function Field({ label, children, hint }) {
  const id = useId();
  const connect = node => {
    if (!isValidElement(node)) return node;
    if (['input', 'select', 'textarea'].includes(node.type)) return cloneElement(node, { id, 'aria-describedby': hint ? `${id}-hint` : undefined });
    return node.props.children ? cloneElement(node, {}, Children.map(node.props.children, connect)) : node;
  };
  return <div className="field"><label htmlFor={id}>{label}</label>{Children.map(children, connect)}{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
export function Modal({ title, description, children, onClose, busy }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={id} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} onClick={e => { if (e.target === ref.current && !busy) { const r = ref.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}><div className="modal-heading"><div><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" aria-label="Cerrar modal" onClick={onClose} disabled={busy}><X /></button></div>{children}</dialog>;
}
export function Confirm({ title, description, onClose, onConfirm, busy, error }) { return <Modal title={title} description={description} onClose={onClose} busy={busy}><Alert>{error}</Alert><div className="modal-actions"><Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button><Button variant="danger" onClick={onConfirm} busy={busy}>Desactivar</Button></div></Modal>; }
export function DataTable({ rows, columns, searchPlaceholder = 'Buscar…', searchBy, filters, emptyTitle, emptyDescription }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(8);
  const filtered = rows.filter(row => !searchBy || searchBy(row).toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  return <div className="table-card"><div className="table-toolbar"><label className="search"><Search /><input aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>{filters}<span className="table-total">{rows.length} registros</span></div>{filtered.length ? <div className="table-scroll"><table><thead><tr>{columns.map(c => <th key={c.key} scope="col">{c.title}</th>)}</tr></thead><tbody>{filtered.slice((current - 1) * size, current * size).map((row, i) => <tr key={row.id ?? i}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}</tr>)}</tbody></table></div> : <Empty title={search ? 'No encontramos coincidencias' : emptyTitle} description={search ? 'Prueba con otro nombre o correo.' : emptyDescription} />}<div className="pagination"><span>{filtered.length ? (current - 1) * size + 1 : 0}–{Math.min(current * size, filtered.length)} de {filtered.length}</span><label>Filas <select aria-label="Filas por página" value={size} onChange={e => { setSize(Number(e.target.value)); setPage(1); }}><option>8</option><option>16</option><option>32</option></select></label><div><button className="icon-button" aria-label="Página anterior" disabled={current === 1} onClick={() => setPage(current - 1)}><ArrowLeft /></button><span>{current} / {pages}</span><button className="icon-button" aria-label="Página siguiente" disabled={current === pages} onClick={() => setPage(current + 1)}><ArrowRight /></button></div></div></div>;
}
export function Stat({ icon: Icon, label, value, detail, tone = '' }) { return <article className={`stat ${tone}`}><div className="stat-top"><span>{label}</span><Icon /></div><strong>{value}</strong><small>{detail}</small></article>; }
export function Biometrics({ value, label }) { return <span className={`biometric ${value === true ? 'good' : ''}`}>{value === true ? <Check /> : <span className="little-dot" />}{label}</span>; }
