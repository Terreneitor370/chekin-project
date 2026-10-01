// STUB de desarrollo para /face-service (NO es la entrega de Jeshua).
// Imita los endpoints del contrato para poder ensayar el flujo del checador
// mientras el serviço real no corre en :8000. Respuestas fijas.
// Uso:  node scripts/face-stub.mjs
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 8000);

function consumir(req) {
  return new Promise((resolve) => {
    let datos = '';
    req.on('data', (c) => (datos += c));
    req.on('end', () => resolve(datos));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader('Content-Type', 'application/json');
  let cuerpo = {};
  try {
    if (req.method === 'POST') await consumir(req);
  } catch {
    cuerpo = {};
  }
  if (req.method === 'GET' && url.pathname === '/health') {
    return res.end(JSON.stringify({ ok: true, model: 'Facenet512', detector: 'opencv', anti_spoofing: true, stub: true }));
  }
  if (req.method === 'POST' && url.pathname === '/validar-foto') {
    return res.end(JSON.stringify({ ok: true, rostros: 1, stub: true }));
  }
  if (req.method === 'POST' && url.pathname === '/verify') {
    return res.end(JSON.stringify({ verified: true, distance: 0.31, threshold: 0.4, is_real: true, model: 'Facenet512', stub: true }));
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'RUTA_NO_EXISTE', stub: true }));
});

server.listen(PORT, '127.0.0.1', () => console.log(`[face-stub] escuchando en 127.0.0.1:${PORT}`));