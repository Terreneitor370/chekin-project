import { Link } from 'react-router-dom';
import { Users, UserCheck, Clock3, ArrowUpRight, RefreshCw, Megaphone, MonitorPlay, Fingerprint, CalendarDays } from 'lucide-react';
import { useSesion } from '../api/sesion';
import { useCargar } from '../components/useCargar';
import { active, today, yes, recorded } from '../components/data';
import { Alert, Button, Loading, PageHeader, Stat } from '../components/ui';
import AttendanceTable from '../components/AttendanceTable';
export default function Dashboard() {
  const { api } = useSesion();
  const attendance = useCargar(api, `/checkins?fecha=${today()}`, 'checkins');
  const people = useCargar(api, '/empleados', 'empleados');
  const rows = attendance.datos || [];
  const employees = people.datos || [];
  const entradas = rows.filter(r => r.tipo === 'entrada');
  const present = new Set(entradas.map(r => r.empleadoId ?? r.empleado?.id ?? r.nombre));
  const total = employees.filter(active).length;
  const hours = Array.from({ length: 12 }, (_, i) => i + 6);
  const buckets = hours.map(hour => entradas.filter(r => { const date = recorded(r); if (!date || !Number.isFinite(Date.parse(date))) return false; return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Hermosillo', hour: '2-digit', hourCycle: 'h23' }).format(new Date(date))) === hour; }).length);
  const max = Math.max(1, ...buckets);
  const ready = employees.filter(e => active(e) && yes(e.tieneHuella) && yes(e.tieneFoto)).length;
  const refresh = () => { attendance.recargar(); people.recargar(); };
  return <><PageHeader eyebrow="TU ORGANIZACIÓN, HOY" title="Un buen día empieza aquí." description="Una mirada clara a la asistencia y a las personas de tu equipo."><Button variant="secondary" onClick={refresh} busy={attendance.loading || people.loading}><RefreshCw />Actualizar</Button></PageHeader><div className="day-line"><CalendarDays /><span>{new Date().toLocaleDateString('es-MX', { timeZone: 'America/Hermosillo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><span className="day-tag">Resumen del día</span></div><Alert retry={refresh}>{attendance.error || people.error}</Alert><div className="stats-grid four"><Stat icon={Users} label="Equipo activo" value={people.datos ? total : '—'} detail="Empleados de la organización" /><Stat icon={UserCheck} label="Registraron entrada" value={attendance.datos ? present.size : '—'} detail="Personas con entrada hoy" tone="mint" /><Stat icon={Clock3} label="Tardanzas" value={attendance.datos ? entradas.filter(r => yes(r.tarde)).length : '—'} detail="Entradas fuera de tolerancia" /><Stat icon={Fingerprint} label="Listos para checar" value={people.datos ? ready : '—'} detail="Huella y rostro vinculados" /></div><div className="dashboard-middle"><section className="card activity-card"><div className="section-heading"><div><h2>Así comienza el día</h2><p>Entradas por hora · Hermosillo</p></div><span className="chart-legend"><i />Entradas</span></div><div className="activity-chart" role="img" aria-label={hours.map((h, i) => `${h}:00, ${buckets[i]} entradas`).join('; ')}>{hours.map((hour, i) => <div className="chart-column" key={hour}><span className="chart-value">{buckets[i] || ''}</span><div className="chart-bar-area"><div style={{ height: `${buckets[i] ? Math.max(5, buckets[i] / max * 100) : 2}%` }} className={buckets[i] ? 'has-data' : ''} /></div><span>{String(hour).padStart(2, '0')}</span></div>)}</div></section><section className="quick-card"><span className="eyebrow">CONECTA CON TU EQUIPO</span><h2>Que todos estén<br />en la misma página.</h2><p>La comunicación también es parte de un gran día de trabajo.</p><Link to="/avisos"><Megaphone /><span>Publicar un aviso</span><ArrowUpRight /></Link><Link to="/multimedia"><MonitorPlay /><span>Gestionar la pantalla</span><ArrowUpRight /></Link></section></div><div className="section-heading"><div><h2>Actividad de hoy</h2><p>Los registros más recientes de tu equipo.</p></div><Link className="text-link" to="/reportes">Ver reportes <ArrowUpRight /></Link></div>{attendance.loading ? <Loading /> : !attendance.error && <AttendanceTable rows={[...rows].sort((a, b) => Date.parse(recorded(b)) - Date.parse(recorded(a)))} />}</>;
}
