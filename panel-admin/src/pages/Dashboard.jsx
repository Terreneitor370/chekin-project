// Resumen del día: presentes, tardanzas y resultado de verificación de cada check-in.
import { useSesion } from '../api/sesion.jsx';
import { useCargar } from '../components/useCargar';

const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Hermosillo' });

export default function Dashboard() {
  const { api } = useSesion();
  const { datos: checkins, error, recargar } = useCargar(api, '/checkins');
  const entradas = (checkins ?? []).filter((c) => c.tipo === 'entrada');

  return (
    <>
      <h2>Hoy <button onClick={recargar}>Actualizar</button></h2>
      {error && <p className="error">{error}</p>}
      <div className="tarjetas">
        <div className="tarjeta"><b>{entradas.length}</b> entradas</div>
        <div className="tarjeta"><b>{entradas.filter((c) => c.tarde).length}</b> tardanzas</div>
        <div className="tarjeta"><b>{(checkins ?? []).length}</b> registros</div>
      </div>
      <table>
        <thead><tr><th>Hora</th><th>Empleado</th><th>Tipo</th><th>Tarde</th><th>Rostro</th><th>Distancia</th></tr></thead>
        <tbody>
          {(checkins ?? []).map((c) => (
            <tr key={c.id}>
              <td>{hora(c.registradoEn)}</td><td>{c.nombre}</td><td>{c.tipo}</td>
              <td>{c.tarde ? 'Sí' : 'No'}</td><td>{c.verificado ? 'Verificado' : 'No'}</td><td>{c.distancia ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
