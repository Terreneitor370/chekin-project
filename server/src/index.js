import http from 'node:http';
import { config } from './config.js';
import { crearApp } from './app.js';
import { iniciarSocket } from './socket.js';

const app = crearApp();
const server = http.createServer(app);
iniciarSocket(server);

server.listen(config.port, () => {
  console.log(`API del checador en http://localhost:${config.port} (${config.env})`);
});
