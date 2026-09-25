// Resumen del día: columna izquierda quién llegó, derecha quién falta / llegó tarde (PDF).
import Contador from './Contador';

const hora = (iso) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Hermosillo' });

export default function ModoResumen({ estado }) {
  if (!estado) return null;
  const tarde = estado.llegaron.filter((l) => l.tarde);
  return (
    <div className="pantalla resumen">
      <Contador totales={estado.totales} conTardanzas />
      <div className="columnas">
        <section>
          <h2>Llegaron hoy</h2>
          {estado.llegaron.map((l) => (
            <div key={l.empleadoId} className="fila">{l.nombre} <span>{hora(l.hora)}</span></div>
          ))}
        </section>
        <section>
          <h2>Faltan</h2>
          {estado.faltan.map((f) => <div key={f.empleadoId} className="fila">{f.nombre}</div>)}
          {tarde.length > 0 && <h2 className="subtitulo">Llegaron tarde</h2>}
          {tarde.map((t) => <div key={t.empleadoId} className="fila tarde">{t.nombre} <span>{hora(t.hora)}</span></div>)}
        </section>
      </div>
    </div>
  );
}
