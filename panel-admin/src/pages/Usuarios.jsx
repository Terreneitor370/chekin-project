import { useState } from 'react';
import { Plus, Pencil, UserRoundMinus, ShieldCheck } from 'lucide-react';
import { useSesion } from '../api/sesion';
import { useCargar } from '../components/useCargar';
import { active } from '../components/data';
import { Alert, Badge, Button, Confirm, DataTable, Field, Loading, Modal, PageHeader, Person, useAction } from '../components/ui';
function UserForm({ user, onClose, saved }) {
  const { api } = useSesion();
  const action = useAction();
  async function submit(e) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    const body = { rol: form.get('rol') };
    if (!user) body.email = form.get('email').trim();
    if (form.get('password')) body.password = form.get('password');
    if (await action.run(() => user ? api.put(`/usuarios/${user.id}`, body) : api.post('/usuarios', body), 'Usuario guardado.')) { saved(); onClose(); }
  }
  return <Modal title={user ? 'Editar acceso' : 'Nuevo usuario'} description="Define quién puede administrar tu organización." onClose={onClose} busy={action.busy}><form className="modal-form" onSubmit={submit}><Field label="Correo electrónico"><input type="email" name="email" required defaultValue={user?.email} disabled={!!user} /></Field><Field label={user ? 'Nueva contraseña (opcional)' : 'Contraseña'} hint={user ? 'Déjala vacía para conservar la actual.' : 'Usa al menos 8 caracteres.'}><input type="password" name="password" autoComplete="new-password" required={!user} minLength={8} /></Field><Field label="Rol"><select name="rol" defaultValue={user?.rol || 'supervisor'}><option value="supervisor">Supervisor</option><option value="admin">Administrador</option></select></Field><div className="info-note"><ShieldCheck /> El administrador gestiona accesos y empleados. El supervisor edita datos, avisos, multimedia y reportes.</div><Alert>{action.error}</Alert><div className="modal-actions"><Button type="button" variant="secondary" disabled={action.busy} onClick={onClose}>Cancelar</Button><Button busy={action.busy}>Guardar usuario</Button></div></form></Modal>;
}
export default function Usuarios() {
  const { api, sesion } = useSesion();
  const { datos, error, loading, recargar } = useCargar(api, '/usuarios', 'usuarios');
  const [editor, setEditor] = useState(null);
  const [remove, setRemove] = useState(null);
  const action = useAction();
  return <><PageHeader title="Accesos bajo control." description="Gestiona las cuentas que administran tu organización."><Button onClick={() => setEditor({})}><Plus />Nuevo usuario</Button></PageHeader><div className="info-note mb-6"><ShieldCheck /> Solo los administradores tienen acceso a este módulo.</div><Alert retry={recargar}>{error}</Alert>{loading && !datos ? <Loading /> : !error && <DataTable rows={datos || []} searchBy={u => u.email} searchPlaceholder="Buscar usuario…" columns={[{ key: 'email', title: 'Usuario', render: u => <Person name={u.email} subtitle={u.id === sesion.usuario.id ? 'Tu cuenta' : 'Acceso al panel'} /> }, { key: 'rol', title: 'Rol', render: u => <Badge tone={u.rol === 'admin' ? 'green' : 'neutral'}>{u.rol === 'admin' ? 'Administrador' : 'Supervisor'}</Badge> }, { key: 'estado', title: 'Estado', render: u => <Badge tone={active(u) ? 'green' : 'neutral'}>{active(u) ? 'Activo' : 'Inactivo'}</Badge> }, { key: 'acciones', title: 'Acciones', render: u => <div className="row-actions">{u.id !== sesion.usuario.id ? <><button className="icon-button" aria-label={`Editar ${u.email}`} onClick={() => setEditor(u)}><Pencil /></button>{active(u) && <button className="icon-button danger-text" aria-label={`Desactivar ${u.email}`} onClick={() => { action.clearError(); setRemove(u); }}><UserRoundMinus /></button>}</> : <span className="subtle">Sesión actual</span>}</div> }]} />}{editor && <UserForm user={editor.id ? editor : null} onClose={() => setEditor(null)} saved={recargar} />}{remove && <Confirm title="Desactivar usuario" description={`${remove.email} perderá el acceso al panel.`} onClose={() => setRemove(null)} busy={action.busy} error={action.error} onConfirm={async () => { if (await action.run(() => api.put(`/usuarios/${remove.id}`, { activo: false }), 'Usuario desactivado.')) { setRemove(null); recargar(); } }} />}</>;
}
