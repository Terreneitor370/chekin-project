import { Server } from 'socket.io';
import { config } from './config.js';
import { validarTokenTv } from './middlewares/auth.js';
import { registrarIo } from './services/eventos.js';

// La TV se conecta con io(URL, { auth: { token } }) y entra a la sala "tv".
export function iniciarSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigins.length ? config.corsOrigins : true },
  });

  io.use(async (socket, next) => {
    try {
      const tv = await validarTokenTv(socket.handshake.auth?.token);
      if (!tv) return next(new Error('NO_AUTENTICADO'));
      socket.data.tv = tv;
      next();
    } catch (e) {
      next(e);
    }
  });

  io.on('connection', (socket) => {
    socket.join('tv');
    console.log(`[socket] TV conectada: ${socket.data.tv.nombre}`);
    socket.on('disconnect', () => console.log(`[socket] TV desconectada: ${socket.data.tv.nombre}`));
  });

  registrarIo(io);
  return io;
}
