// PM2: mantiene la API y el face-service corriendo 24/7 (PDF: "PM2 para mantener Node.js corriendo").
// Uso en el VPS:  pm2 start infra/ecosystem.config.cjs && pm2 save && pm2 startup
const scriptFace = process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python';
const argsFace = '-m uvicorn main:app --host 127.0.0.1 --port 8000';

module.exports = {
  apps: [
    {
      name: 'checador-api',
      cwd: './server',
      script: 'src/index.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
    },
    {
      name: 'checador-face',
      cwd: './face-service',
      script: scriptFace,
      args: argsFace,
      interpreter: 'none',
      max_memory_restart: '3G',
    },
  ],
};
