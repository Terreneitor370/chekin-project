import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Se publica en https://<dominio>/tv/ (Nginx). En desarrollo, /api, /socket.io y /uploads van al backend local.
export default defineConfig({
  base: '/tv/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
  build: {
    target: 'es2017', // navegadores del Roku: evitar sintaxis demasiado nueva
  },
});
