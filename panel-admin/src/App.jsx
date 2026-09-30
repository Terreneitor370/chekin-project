import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Fingerprint, LayoutDashboard, Users, Megaphone, MonitorPlay, ChartNoAxesCombined, ShieldCheck, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useSesion } from './api/sesion.jsx';
import { NoticeProvider } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Empleados from './pages/Empleados';
import Avisos from './pages/Avisos';
import Multimedia from './pages/Multimedia';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import { DEMO_MODE } from './api/demo';
import DemoBar from './components/DemoBar';
const menu = [
  { path: '/', label: 'Resumen', icon: LayoutDashboard, element: <Dashboard /> },
  { path: '/empleados', label: 'Empleados', icon: Users, element: <Empleados /> },
  { path: '/avisos', label: 'Avisos', icon: Megaphone, element: <Avisos /> },
  { path: '/multimedia', label: 'Multimedia', icon: MonitorPlay, element: <Multimedia /> },
  { path: '/reportes', label: 'Reportes', icon: ChartNoAxesCombined, element: <Reportes /> },
  { path: '/usuarios', label: 'Usuarios y accesos', icon: ShieldCheck, element: <Usuarios />, admin: true },
];
export default function App() {
  const { sesion, salir } = useSesion();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (DEMO_MODE && new URLSearchParams(location.search).get('demo') !== '1') navigate({ pathname: location.pathname, search: '?demo=1' }, { replace: true, state: location.state });
  }, [location, navigate]);
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!sesion) return <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Navigate to="/login" replace state={{ from: location.pathname }} />} /></Routes>;
  const links = menu.filter(item => !item.admin || sesion.usuario.rol === 'admin');
  const current = links.find(item => item.path === location.pathname);
  return <NoticeProvider><div className="app-shell">{mobileOpen && <button className="sidebar-backdrop" aria-label="Cerrar navegación" onClick={() => setMobileOpen(false)} />}<aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}><NavLink className="brand" to="/"><span className="brand-icon"><Fingerprint /></span>Checker<span className="brand-point">.</span></NavLink><div className="workspace"><span className="workspace-avatar">C</span><div><strong>Mi organización</strong><span>Control de asistencia</span></div><ShieldCheck /></div><span className="nav-label">PRINCIPAL</span><nav aria-label="Navegación principal">{links.map(({ path, label, icon: Icon }) => <NavLink end key={path} to={path} onClick={() => setMobileOpen(false)}><Icon />{label}{location.pathname === path && <span className="nav-dot" />}</NavLink>)}</nav><div className="sidebar-note"><span className="note-icon"><Fingerprint /></span><strong>Personas, conectadas.</strong><p>Un espacio para cuidar el tiempo de tu equipo.</p><span className="note-line" /></div><div className="user-block"><span className="user-avatar">{sesion.usuario.email.slice(0, 2).toUpperCase()}</span><div><strong title={sesion.usuario.email}>{sesion.usuario.email}</strong><span>{sesion.usuario.rol === 'admin' ? 'Administrador' : 'Supervisor'}</span></div><button className="icon-button" aria-label="Cerrar sesión" onClick={salir}><LogOut /></button></div></aside><div className="workspace-main"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Abrir navegación" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button><span>Espacio de trabajo</span><ChevronRight /><strong>{current?.label || 'Resumen'}</strong></div><span className="session-label"><span /> {DEMO_MODE ? 'Vista de demostración' : 'Sesión segura'}</span></header>{DEMO_MODE && <DemoBar />}<main className="page-content"><Routes><Route path="/login" element={<Navigate to={location.state?.from && location.state.from !== '/login' ? location.state.from : '/'} replace />} />{links.map(item => <Route key={item.path} path={item.path} element={item.element} />)}<Route path="*" element={<Navigate to="/" replace />} /></Routes><footer className="page-footer"><span>Checker · Cada persona cuenta.</span><span>Horarios de Hermosillo, Sonora</span></footer></main></div></div></NoticeProvider>;
}
