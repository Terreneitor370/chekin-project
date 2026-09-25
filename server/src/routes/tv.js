import { Router } from 'express';
import { requireTv } from '../middlewares/auth.js';
import { estadoDelDia } from '../services/estadoTv.js';

const router = Router();

// GET /api/tv/estado?token=...  (al cargar y en cada reconexión del socket)
router.get('/estado', requireTv, async (req, res) => {
  res.json(await estadoDelDia(req.query.token));
});

export default router;
