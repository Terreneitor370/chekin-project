// CRUD del ticker de la TV. Cada cambio se refleja en el Roku en tiempo real (evento nuevo-aviso).
import { useState } from 'react';
import { useSesion } from '../api/sesion.jsx';
import { useCargar } from '../components/useCargar';

export default function Avisos() {
  const { api } = useSesion();
  const { datos: avisos, error, recargar } = useCargar(api, '/avisos');
  const [mensaje, setMensaje] = useState('');

  async function crear(e) {
    e.preventDefault();
    await api.post('/avisos', { mensaje });
    setMensaje('');
    recargar();
  }

  async function alternar(aviso) {
    await api.put(`/avisos/${aviso.id}`, { activo: aviso.activo ? 0 : 1 });
    recargar();
  }

  return (
    <>
      <h2>Avisos</h2>
      {error && <p className="error">{error}</p>}
      <form className="formulario" onSubmit={crear}>
        <input placeholder="Ej. Reunión a las 3 pm" value={mensaje} maxLength={255} onChange={(e) => setMensaje(e.target.value)} required />
        <button>Publicar en la TV</button>
      </form>
      <table>
        <thead><tr><th>Mensaje</th><th>Activo</th><th></th></tr></thead>
        <tbody>
          {(avisos ?? []).map((a) => (
            <tr key={a.id}>
              <td>{a.mensaje}</td><td>{a.activo ? 'Sí' : 'No'}</td>
              <td><button className="secundario" onClick={() => alternar(a)}>{a.activo ? 'Ocultar' : 'Mostrar'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
