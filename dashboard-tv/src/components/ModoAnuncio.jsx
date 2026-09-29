import { useState } from 'react';
import { Check, Fingerprint, LogIn, LogOut } from 'lucide-react';
import { urlConToken } from '../config';
export default function ModoAnuncio({ checkin }) {
  const [failed, setFailed] = useState(false);
  const salida = checkin.tipo === 'salida';
  const Icon = salida ? LogOut : LogIn;
  const hora = new Date(checkin.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Hermosillo' });
  return <div className={`checkin-panel ${checkin.tarde ? 'late' : ''}`} role="status"><div className="checkin-heading"><span className="check-circle"><Check /></span> Asistencia registrada</div><div className="checkin-body"><div className="portrait-frame">{checkin.fotoUrl && !failed ? <img src={urlConToken(checkin.fotoUrl)} alt={checkin.nombre} onError={() => setFailed(true)} /> : <div className="portrait-fallback"><Fingerprint /><span>{checkin.nombre?.split(' ').slice(0, 2).map(s => s[0]).join('')}</span></div>}<i /><i /><i /><i /></div><div className="checkin-copy"><p className="eyebrow">{salida ? 'HASTA PRONTO' : 'QUÉ GUSTO VERTE'}</p><h1>{checkin.nombre}</h1>{checkin.puesto && <p className="muted">{checkin.puesto}</p>}<div className="checkin-badge"><Icon />{salida ? 'Salida' : checkin.tarde ? 'Entrada · Tardanza' : 'Entrada'}</div><div className="checkin-time">{hora}<span>Hora de registro</span></div></div></div><div className="checkin-progress" /></div>;
}
