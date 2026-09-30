import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { errores } from '../utils/errores.js';
import { firmarJwt } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import { login as esquemaLogin } from '../validacion.js';

const router = Router();

// POST /api/auth/login
router.post('/login', validar(esquemaLogin), async (req, res) => {
  const { email, password } = req.body;
  const [usuario] = await query('SELECT id, email, password_hash, rol FROM usuarios WHERE email = ? AND activo = 1', [email]);
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    throw errores.noAutenticado('Email o contraseña incorrectos');
  }
  const datos = { tipo: 'admin', id: usuario.id, email: usuario.email, rol: usuario.rol };
  res.json({ token: firmarJwt(datos, '1h'), usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol } });
});

export default router;
