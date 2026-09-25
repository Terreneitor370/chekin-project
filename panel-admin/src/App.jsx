import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useSesion } from './api/sesion.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Empleados from './pages/Empleados.jsx';
import Avisos from './pages/Avisos.jsx';
import Multimedia from './pages/Multimedia.jsx';
import Reportes from './pages/Reportes.jsx';

// Pantallas del PDF con su rol mínimo
const MENU = [
  { ruta: '/', texto: 'Dashboard', rol: 'supervisor', elemento: <Dashboard /> },
  { ruta: '/empleados', texto: 'Empleados', rol: 'supervisor', elemento: <Empleados /> },
  { ruta: '/avisos', texto: 'Avisos', rol: 'supervisor', elemento: <Avisos /> },
  { ruta: '/multimedia', texto: 'Multimedia', rol: 'supervisor', elemento: <Multimedia /> },
  { ruta: '/reportes', texto: 'Reportes', rol: 'supervisor', elemento: <Reportes /> },
];

export default function App() {
  const { sesion, salir } = useSesion();
  if (!sesion) return <Login />;

  return (
    <div className="layout">
      <aside>
        <h1>Checador</h1>
        {MENU.map((m) => (
          <NavLink key={m.ruta} to={m.ruta} end>{m.texto}</NavLink>
        ))}
        <div className="usuario">
          {sesion.usuario.email} ({sesion.usuario.rol})
          <button onClick={salir}>Salir</button>
        </div>
      </aside>
      <main>
        <Routes>
          {MENU.map((m) => <Route key={m.ruta} path={m.ruta} element={m.elemento} />)}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
