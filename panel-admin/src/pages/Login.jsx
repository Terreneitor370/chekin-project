import { useState } from 'react';

import { Fingerprint, ArrowRight, Eye, EyeOff, ShieldCheck, Check, Clock3 } from 'lucide-react';
import { useSesion } from '../api/sesion';
import { Alert, Button, Field } from '../components/ui';
import { DEMO_MODE, demoSession } from '../api/demo';
export default function Login() {
  const { api, login, expired } = useSesion();


  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); if (DEMO_MODE) { login(demoSession()); return; } if (busy) return; setBusy(true); setError('');
    const data = new FormData(e.currentTarget);
    try { login(await api.post('/auth/login', { email: data.get('email').trim(), password: data.get('password') })); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="login-layout"><section className="login-story"><div className="brand"><span className="brand-icon"><Fingerprint /></span>Checker<span className="brand-point">.</span></div><div className="login-orbit" /><div className="login-story-copy"><span className="eyebrow">CADA PERSONA CUENTA</span><h1>Un equipo conectado.<br /><em>Un mejor comienzo.</em></h1><p>La asistencia, la comunicación y el día a día de tu organización, en un solo lugar.</p><div className="login-sample"><span className="sample-check"><Check /></span><div><strong>Todo empieza con estar.</strong><span>Identidad segura. Equipo presente.</span></div><Clock3 /></div></div><div className="login-story-footer"><ShieldCheck /> Diseñado para conectar personas.</div></section><section className="login-side"><div className="login-form-wrap"><span className="login-kicker">PANEL DE ADMINISTRACIÓN</span><h2>Bienvenido de nuevo</h2><p>Ingresa a tu espacio de trabajo.</p>{expired && <Alert>Tu sesión expiró. Inicia sesión de nuevo para continuar.</Alert>}{DEMO_MODE && <div className="info-note">Demo local con datos ficticios. No ingreses credenciales reales.</div>}<form onSubmit={submit}><Field label="Correo electrónico"><input autoComplete="username" name="email" type="email" placeholder="nombre@organizacion.com" required autoFocus /></Field><Field label="Contraseña"><span className="password-input"><input autoComplete="current-password" name="password" type={show ? 'text' : 'password'} placeholder="Ingresa tu contraseña" required /><button type="button" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></span></Field><Alert>{error}</Alert>{DEMO_MODE ? <Button type="button" className="login-submit" onClick={() => login(demoSession())}>Entrar a la demo <ArrowRight /></Button> : <Button busy={busy} type="submit" className="login-submit">Iniciar sesión <ArrowRight /></Button>}</form><p className="login-help"><ShieldCheck /> Acceso exclusivo para administradores y supervisores.</p><div className="login-support">¿Necesitas acceso? Contacta al administrador de tu organización.</div></div><footer>Checker · Gestión de asistencia</footer></section></div>;
}
