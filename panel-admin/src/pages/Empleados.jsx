// CRUD de empleados + código de vinculación para registrar el teléfono (huella y foto).
import { useState } from 'react';
import { useSesion } from '../api/sesion.jsx';
import { useCargar } from '../components/useCargar';

export default function Empleados() {
  const { api, sesion } = useSesion();
  const esAdmin = sesion.usuario.rol === 'admin';
  const { datos: empleados, error, recargar } = useCargar(api, '/empleados');
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', horaEntrada: '08:00', toleranciaMin: 10 });
  const [codigo, setCodigo] = useState(null);
  const [aviso, setAviso] = useState(null);

  async function crear(e) {
    e.preventDefault();
    try {
      await api.post('/empleados', { ...nuevo, toleranciaMin: Number(nuevo.toleranciaMin) });
      setNuevo({ nombre: '', email: '', horaEntrada: '08:00', toleranciaMin: 10 });
      recargar();
    } catch (err) { setAviso(err.message); }
  }

  async function generarCodigo(emp) {
    try {
      const r = await api.post(`/empleados/${emp.id}/codigo`);
      setCodigo({ nombre: emp.nombre, ...r });
    } catch (err) { setAviso(err.message); }
  }

  async function desactivar(emp) {
    if (!window.confirm(`¿Desactivar a ${emp.nombre}?`)) return;
    await api.del(`/empleados/${emp.id}`);
    recargar();
  }

  return (
    <>
      <h2>Empleados</h2>
      {(error || aviso) && <p className="error">{error || aviso}</p>}
      {codigo && (
        <div className="codigo">
          Código para <b>{codigo.nombre}</b>: <span>{codigo.codigo}</span> (vence en 15 minutos)
          <button onClick={() => setCodigo(null)}>Cerrar</button>
        </div>
      )}
      <table>
        <thead><tr><th>Nombre</th><th>Entrada</th><th>Tolerancia</th><th>Huella</th><th>Foto</th><th>Activo</th>{esAdmin && <th>Acciones</th>}</tr></thead>
        <tbody>
          {(empleados ?? []).map((e) => (
            <tr key={e.id}>
              <td>{e.nombre}</td><td>{e.horaEntrada}</td><td>{e.toleranciaMin} min</td>
              <td>{e.tieneHuella ? 'Sí' : 'No'}</td><td>{e.tieneFoto ? 'Sí' : 'No'}</td><td>{e.activo ? 'Sí' : 'No'}</td>
              {esAdmin && (
                <td>
                  <button onClick={() => generarCodigo(e)}>Código de registro</button>
                  <button className="secundario" onClick={() => desactivar(e)}>Desactivar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {esAdmin && (
        <form className="formulario" onSubmit={crear}>
          <h3>Nuevo empleado</h3>
          <input placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} required />
          <input placeholder="Email" type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
          <label>Entrada <input type="time" value={nuevo.horaEntrada} onChange={(e) => setNuevo({ ...nuevo, horaEntrada: e.target.value })} /></label>
          <label>Tolerancia (min) <input type="number" min="0" value={nuevo.toleranciaMin} onChange={(e) => setNuevo({ ...nuevo, toleranciaMin: e.target.value })} /></label>
          <button>Agregar</button>
        </form>
      )}
    </>
  );
}
