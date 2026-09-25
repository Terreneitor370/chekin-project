import { useState } from 'react';
import { useSesion } from '../api/sesion.jsx';

export default function Login() {
  const { api, setSesion } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      setSesion(await api.post('/auth/login', { email, password }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form className="login" onSubmit={entrar}>
      <h1>Checador - Panel</h1>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      {error && <p className="error">{error}</p>}
      <button disabled={cargando}>{cargando ? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
}
