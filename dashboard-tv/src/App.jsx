import { Fingerprint, Radio, WifiOff, ShieldCheck, Users, Clock3 } from 'lucide-react';
import { useEstadoTv } from './hooks/useEstadoTv';
import { useModoPantalla } from './hooks/useModoPantalla';
import ModoMultimedia from './components/ModoMultimedia';
import ModoAnuncio from './components/ModoAnuncio';
import ModoResumen from './components/ModoResumen';
import Reloj from './components/Reloj';
import Ticker from './components/Ticker';

export default function App() {
  const { modo, actual, encolar } = useModoPantalla();
  const { estado, conectado, error } = useEstadoTv({ onCheckin: encolar });
  const online = conectado && estado && !error;
  const total = estado?.totales;
  return <main className="tv-shell">
    <header className="flex items-center justify-between">
      <div className="brand flex items-center gap-5"><span className="brand-mark"><Fingerprint /></span><strong>Checker<span>.</span></strong><span className="brand-divider" /><span className="muted">Personas. Presencia. Conexión.</span></div>
      <div className={`status ${online ? '' : 'offline'}`}><span className="status-dot" />{online ? 'Sistema en vivo' : 'Sincronizando'}</div>
    </header>
    <div className="dashboard-grid">
      <section className="main-stage relative overflow-hidden rounded-3xl border border-white/10">
        <ModoMultimedia estado={estado} visible={modo === 'multimedia'} />
        {modo === 'anuncio' && <ModoAnuncio key={actual.checkinId} checkin={actual} />}
        {modo === 'resumen' && <ModoResumen estado={estado} />}
        {!online && <div className="connection-overlay"><div className="connection-icon"><WifiOff /></div><span className="eyebrow">CONEXIÓN CON EL SISTEMA</span><h1>{error === 'token' ? 'Pantalla sin vincular' : 'Reconectando...'}</h1><p>{error === 'token' ? 'Revisa el token de acceso de esta TV.' : 'Estamos recuperando la conexión. La pantalla se actualizará automáticamente.'}</p><div className="reconnect-dots"><i /><i /><i /></div></div>}
      </section>
      <aside className="sidebar">
        <section className="clock-card"><div className="eyebrow flex items-center gap-3"><Clock3 /> HERMOSILLO, SONORA</div><Reloj /><div className="clock-line" /></section>
        <section className="attendance-card"><div className="flex items-center justify-between"><span className="eyebrow">ASISTENCIA DE HOY</span><Users /></div><div className="attendance-number">{total?.presentes ?? '—'}<span> / {total?.empleados ?? '—'}</span></div><div className="muted">personas registradas</div><div className="attendance-track"><span style={{ width: `${total?.empleados ? Math.min(100, total.presentes / total.empleados * 100) : 0}%` }} /></div><div className="attendance-meta"><span><i /> Presentes</span><span>{total ? Math.max(0, total.empleados - total.presentes) : '—'} pendientes</span></div></section>
      </aside>
    </div>
    <Ticker avisos={estado?.avisos} />
    <footer className="flex items-center justify-between"><span className="flex items-center gap-3"><ShieldCheck /> Registro seguro · Acceso biométrico</span><span className="flex items-center gap-3"><Radio /> {modo === 'anuncio' ? 'Registro de asistencia' : modo === 'resumen' ? 'Resumen del día' : 'Canal institucional'}</span></footer>
  </main>;
}
