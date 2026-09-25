import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { dbDisponible } from './db.js';
import { faceDisponible } from './services/faceClient.js';
import { requireTvOAdmin } from './middlewares/auth.js';
import { errorHandler, noEncontrado } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import dispositivosRoutes from './routes/dispositivos.js';
import biometriaRoutes from './routes/biometria.js';
import empleadosRoutes from './routes/empleados.js';
import checkinRoutes from './routes/checkin.js';
import tvRoutes from './routes/tv.js';
import avisosRoutes from './routes/avisos.js';
import multimediaRoutes from './routes/multimedia.js';
import reportesRoutes, { checkinsRouter } from './routes/reportes.js';

export function crearApp() {
  const app = express();
  app.set('trust proxy', 1); // detrás de Nginx
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : true }));
  app.use(express.json({ limit: '1mb' }));

  // Rate limit general y uno más estricto para check-in (prueba 7 del PDF: 50 en 1 min)
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));
  const limiteCheckin = rateLimit({
    windowMs: 60_000,
    limit: 20,
    handler: (_req, res) => res.status(429).json({ error: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiadas solicitudes, espera un momento' } }),
  });

  app.get('/health', async (_req, res) => {
    const [db, faceService] = await Promise.all([dbDisponible(), faceDisponible()]);
    res.json({ ok: db, db, faceService, hora: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dispositivos', dispositivosRoutes);
  app.use('/api/biometria', biometriaRoutes);
  app.use('/api/empleados', empleadosRoutes);
  app.use('/api/checkin', limiteCheckin, checkinRoutes);
  app.use('/api/checkins', checkinsRouter);
  app.use('/api/tv', tvRoutes);
  app.use('/api/avisos', avisosRoutes);
  app.use('/api/multimedia', multimediaRoutes);
  app.use('/api/reportes', reportesRoutes);

  // Archivos: multimedia es pública (la TV la reproduce); selfies requieren token; registro nunca se sirve.
  app.use('/uploads/multimedia', express.static(`${config.uploadsDir}/multimedia`));
  app.use('/uploads/checkins', requireTvOAdmin, express.static(`${config.uploadsDir}/checkins`));

  app.use(noEncontrado);
  app.use(errorHandler);
  return app;
}
