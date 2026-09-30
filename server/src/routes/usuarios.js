import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, modificar } from '../db.js';
import { errores } from '../utils/errores.js';
import { requireRol } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import { idParam, crearUsuario, actualizarUsuario } from '../validacion.js';

const router = Router();

// Usuarios del panel: solo admin (docs/api.md seccion 6). El supervisor no entra.
router.use(requireRol('admin'));

// usuarios.email es UNIQUE. Sin esto, repetir un correo devolvia 500 con el error
// crudo de MySQL; el contrato pide 409 con mensaje en espanol.
async function exigirCorreoLibre(correo, idExcluido = null) {
  if (!correo) return;
  const [repetido] = await query('SELECT id FROM usuarios WHERE email = ? AND (? IS NULL OR id <> ?)', [correo, idExcluido, idExcluido]);
  if (repetido) throw errores.correoDuplicado();
}

function traducirDuplicado(e) {
  if (e?.code === 'ER_DUP_ENTRY' && /usuarios\.email/.test(e.sqlMessage ?? '')) {
    return errores.correoDuplicado();
  }
  return e;
}

// GET /api/usuarios
router.get('/', async (_req, res) => {
  const filas = await query(
    'SELECT id, email, rol, activo FROM usuarios ORDER BY activo DESC, email',
  );
  res.json(filas);
});

// POST /api/usuarios  { email, password, rol }
router.post('/', validar(crearUsuario), async (req, res) => {
  const { email, password, rol } = req.body;
  await exigirCorreoLibre(email);
  const hash = await bcrypt.hash(password, 12);
  let r;
  try {
    r = await query(
      'INSERT INTO usuarios (email, password_hash, rol, creado_por) VALUES (?, ?, ?, ?)',
      [email, hash, rol, req.usuario.id],
    );
  } catch (e) {
    throw traducirDuplicado(e);
  }
  res.status(201).json({ id: r.insertId });
});

// PUT /api/usuarios/:id  { rol?, password?, email?, activo? }
// El panel manda solo { activo: false } para desactivar, asi que nada es obligatorio.
router.put('/:id', validar(idParam, 'params'), validar(actualizarUsuario), async (req, res) => {
  const { email, password, rol, activo } = req.body;

  // No dejar que un usuario se baje a si mismo y deje la organizacion sin admin.
  if (rol === 'supervisor' || activo === false) {
    const [objetivo] = await query('SELECT rol FROM usuarios WHERE id = ?', [req.params.id]);
    if (objetivo?.rol === 'admin' && (rol === 'supervisor' || activo === false)) {
      const [{ n }] = await query("SELECT COUNT(*) n FROM usuarios WHERE rol = 'admin' AND activo = 1");
      if (n <= 1) throw errores.datosInvalidos('Debe quedar al menos un administrador activo');
    }
  }

  await exigirCorreoLibre(email, req.params.id);
  const hash = password ? await bcrypt.hash(password, 12) : null;
  try {
    await modificar(
      `UPDATE usuarios SET
         email = COALESCE(?, email),
         password_hash = COALESCE(?, password_hash),
         rol = COALESCE(?, rol),
         activo = COALESCE(?, activo)
       WHERE id = ?`,
      [email ?? null, hash, rol ?? null, activo === undefined ? null : (activo ? 1 : 0), req.params.id],
      'Usuario no encontrado',
    );
  } catch (e) {
    throw traducirDuplicado(e);
  }
  res.json({ ok: true });
});

export default router;
