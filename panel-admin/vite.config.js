import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Se publica en https://<dominio>/admin/ (Nginx). En desarrollo, /api va al backend local.
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000', '/uploads': 'http://localhost:3000' },
  },
});
