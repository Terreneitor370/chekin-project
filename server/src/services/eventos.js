// Punto único para emitir eventos Socket.IO (los nombres son los del PDF).
let io = null;

export function registrarIo(instancia) {
  io = instancia;
}

export function emitirTv(evento, datos) {
  if (io) io.to('tv').emit(evento, datos);
}

export const EVENTOS = {
  NUEVO_CHECKIN: 'nuevo-checkin',
  NUEVO_AVISO: 'nuevo-aviso',
  NUEVO_MULTIMEDIA: 'nuevo-multimedia',
};
