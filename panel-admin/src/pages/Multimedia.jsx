// Subir y ordenar videos MP4 del modo multimedia (evento nuevo-multimedia).
import { useState } from 'react';
import { useSesion } from '../api/sesion.jsx';
import { useCargar } from '../components/useCargar';

export default function Multimedia() {
  const { api, sesion } = useSesion();
  const esAdmin = sesion.usuario.rol === 'admin';
  const { datos: videos, error, recargar } = useCargar(api, '/multimedia');
  const [archivo, setArchivo] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [estado, setEstado] = useState(null);

  async function subir(e) {
    e.preventDefault();
    const form = new FormData();
    form.append('video', archivo);
    form.append('titulo', titulo || archivo.name);
    form.append('orden', String((videos?.length ?? 0) + 1));
    setEstado('Subiendo...');
    try {
      await api.post('/multimedia', form);
      setEstado(null);
      setTitulo('');
      recargar();
    } catch (err) { setEstado(err.message); }
  }

  async function cambiar(video, cambios) {
    await api.put(`/multimedia/${video.id}`, cambios);
    recargar();
  }

  return (
    <>
      <h2>Multimedia</h2>
      {error && <p className="error">{error}</p>}
      {esAdmin && (
        <form className="formulario" onSubmit={subir}>
          <input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <input type="file" accept="video/mp4" onChange={(e) => setArchivo(e.target.files[0])} required />
          <button disabled={!archivo}>Subir MP4</button>
          {estado && <span>{estado}</span>}
        </form>
      )}
      <table>
        <thead><tr><th>Orden</th><th>Título</th><th>Activo</th>{esAdmin && <th></th>}</tr></thead>
        <tbody>
          {(videos ?? []).map((v) => (
            <tr key={v.id}>
              <td>{v.orden}</td><td>{v.titulo}</td><td>{v.activo ? 'Sí' : 'No'}</td>
              {esAdmin && (
                <td>
                  <button className="secundario" onClick={() => cambiar(v, { orden: Math.max(1, v.orden - 1) })}>Subir</button>
                  <button className="secundario" onClick={() => cambiar(v, { orden: v.orden + 1 })}>Bajar</button>
                  <button className="secundario" onClick={() => cambiar(v, { activo: v.activo ? 0 : 1 })}>{v.activo ? 'Ocultar' : 'Mostrar'}</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
