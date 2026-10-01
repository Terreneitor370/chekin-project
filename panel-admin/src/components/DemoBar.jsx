import { useSesion } from '../api/sesion';
export default function DemoBar() {
  const { sesion, cambiarRolDemo } = useSesion();
  return <aside className="demo-banner" aria-label="Modo demo">
    <div><strong>DEMO · Datos ficticios</strong><span>Cambios locales; se reinician al recargar. Sin conexión con la TV real.</span></div>
    <div className="demo-actions"><select aria-label="Rol de demostración" value={sesion.usuario.rol} onChange={e => cambiarRolDemo(e.target.value)}><option value="admin">Administrador</option><option value="supervisor">Supervisor</option></select><a href="/admin/?demo=1">Reiniciar</a><a href="/admin/login?demo=1">Ver login</a><a href="/admin/login">Salir de la demo</a></div>
  </aside>;
}
