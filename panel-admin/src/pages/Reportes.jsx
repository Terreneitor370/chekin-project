// Historial por rango de fechas + exportar CSV.
import { useState } from 'react';
import { useSesion } from '../api/sesion.jsx';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Hermosillo' }).format(new Date());

export default function Reportes() {
  const { api } = useSesion();
  const [desde, setDesde] = useState(hoy());
  const [hasta, setHasta] = useState(hoy());
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState(null);

  const ruta = (formato) => `/reportes/asistencia?desde=${desde}&hasta=${hasta}&formato=${formato}`;

  async function consultar() {
    try { setFilas(await api.get(ruta('json'))); setError(null); } catch (e) { setError(e.message); }
  }

  async function descargarCsv() {
    const texto = await api.get(ruta('csv'));
    const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_${desde}_${hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <h2>Reportes</h2>
      <div className="formulario">
        <label>Desde <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label>Hasta <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        <button onClick={consultar}>Consultar</button>
        <button className="secundario" onClick={descargarCsv}>Exportar CSV</button>
      </div>
      {error && <p className="error">{error}</p>}
      {filas && (
        <table>
          <thead><tr><th>Fecha y hora</th><th>Empleado</th><th>Tipo</th><th>Tarde</th><th>Verificado</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>
                <td>{new Date(f.registradoEn).toLocaleString('es-MX', { timeZone: 'America/Hermosillo' })}</td>
                <td>{f.nombre}</td><td>{f.tipo}</td><td>{f.tarde ? 'Sí' : 'No'}</td><td>{f.verificado ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
