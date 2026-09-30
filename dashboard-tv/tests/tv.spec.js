import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

let server, io, requests, snapshot, failState;
const initial = () => ({ fecha: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Hermosillo' }).format(new Date()), totales: { empleados: 24, presentes: 18, tardanzas: 2 }, llegaron: [], faltan: [], avisos: [{ id: 1, mensaje: 'Construimos un gran equipo. Gracias por ser parte.' }], multimedia: [] });
test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (!req.url.startsWith('/api/tv/estado')) { res.writeHead(404).end(); return; }
    requests++;
    if (failState) { res.writeHead(503).end(); return; }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(snapshot));
  });
  io = new Server(server);
  io.use((socket, next) => socket.handshake.auth.token === 'test-token' ? next() : next(new Error('unauthorized')));
  await new Promise(resolve => server.listen(3000, '127.0.0.1', resolve));
});
test.afterAll(async () => { await new Promise(resolve => io.close(resolve)); });
test.beforeEach(() => { requests = 0; failState = false; snapshot = initial(); });
async function open(page) {
  await page.goto('/tv/?token=test-token');
  await expect(page.getByText('Sistema en vivo')).toBeVisible();
}
const event = i => ({ checkinId: i, empleadoId: i, nombre: `Persona ${i}`, tipo: i === 10 ? 'salida' : 'entrada', tarde: i === 2, hora: '2026-09-29T15:04:00.000Z', totales: { empleados: 24, presentes: 18, tardanzas: 2 } });

test('1080p: safe area, font size, no overflow and live notices', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await page.waitForTimeout(600);
  await expect(page.getByRole('heading', { name: 'Un gran día empieza contigo.' })).toBeVisible();
  const layout = await page.evaluate(() => {
    const shell = document.querySelector('.tv-shell');
    const stage = document.querySelector('.main-stage').getBoundingClientRect();
    const smallText = [...shell.querySelectorAll('*')].filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && el.getBoundingClientRect().height && parseFloat(getComputedStyle(el).fontSize) < 32).map(el => el.className);
    const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
    const childrenFit = [...document.querySelector('.sidebar').children].every(el => el.getBoundingClientRect().bottom <= sidebar.bottom + 1);
    return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, left: stage.left, smallText, childrenFit };
  });
  expect(layout).toEqual({ width: 1920, height: 1080, left: 96, smallText: [], childrenFit: true });
  await page.screenshot({ path: 'test-results/multimedia-1080p.png' });
  io.emit('nuevo-aviso', { avisos: [{ id: 2, mensaje: 'Reunión a las 3 pm' }] });
  await expect(page.locator('.ticker-texto')).toHaveText('Reunión a las 3 pm');
  expect(errors).toEqual([]);
});

test('ten check-ins keep their four seconds, deduplicate, summarize and return', async ({ page }) => {
  await open(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  for (let i = 1; i <= 10; i++) io.emit('nuevo-checkin', event(i));
  io.emit('nuevo-checkin', event(1));
  for (let i = 1; i <= 10; i++) {
    await expect(page.locator('.checkin-copy h1')).toHaveText(`Persona ${i}`);
    if (i === 1) await page.screenshot({ path: 'test-results/checkin-1080p.png' });
    if (i === 2) await expect(page.locator('.checkin-badge')).toHaveText('Entrada · Tardanza');
    if (i === 10) await expect(page.locator('.checkin-badge')).toHaveText('Salida');
    await page.clock.fastForward(3999);
    await expect(page.locator('.checkin-copy h1')).toHaveText(`Persona ${i}`);
    await page.clock.fastForward(1);
  }
  await expect(page.locator('.resumen')).toBeVisible();
  await page.screenshot({ path: 'test-results/resumen-1080p.png' });
  await page.clock.fastForward(15000);
  await expect(page.locator('.institutional-art')).toBeVisible();
  await expect(page.locator('.resumen')).toHaveCount(0);
});

test('reconnect refreshes snapshot and HTTP failure retries automatically', async ({ page }) => {
  await open(page);
  const previous = requests;
  failState = true;
  for (const socket of io.sockets.sockets.values()) socket.conn.close();
  await expect(page.getByRole('heading', { name: 'Reconectando...' })).toBeVisible();
  await expect.poll(() => requests).toBeGreaterThan(previous);
  await page.screenshot({ path: 'test-results/reconexion-1080p.png' });
  snapshot.totales.presentes = 21;
  failState = false;
  await expect(page.getByText('Sistema en vivo')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.attendance-number')).toContainText('21');
});

test('missing TV token and broken media have designed fallback states', async ({ page }) => {
  await page.goto('/tv/');
  await expect(page.getByRole('heading', { name: 'Pantalla sin vincular' })).toBeVisible();
  expect(requests).toBe(0);
  snapshot.multimedia = [{ id: 1, titulo: 'Video', orden: 1, url: '/uploads/missing.mp4' }];
  await open(page);
  await expect(page.getByText('Contenido no disponible')).toBeVisible();
  io.emit('nuevo-checkin', { ...event(1), fotoUrl: '/uploads/missing.jpg' });
  await expect(page.locator('.portrait-fallback')).toBeVisible();
});

test('summary displays every employee beyond the first fifteen', async ({ page }) => {
  snapshot.llegaron = Array.from({ length: 18 }, (_, i) => ({ empleadoId: i + 1, nombre: `Persona ${i + 1}`, hora: event(i).hora, tarde: false }));
  await open(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  io.emit('nuevo-checkin', event(1));
  await expect(page.locator('.checkin-copy h1')).toHaveText('Persona 1');
  await page.clock.fastForward(4000);
  await expect(page.locator('.summary-page')).toContainText('Página 1 de 4');
  for (let p = 2; p <= 4; p++) {
    await page.clock.fastForward(5000);
    await expect(page.locator('.summary-page')).toContainText(`Página ${p} de 4`);
  }
  await expect(page.locator('.fila').filter({ hasText: 'Persona 18' })).toBeVisible();
  await page.clock.fastForward(4999);
  await expect(page.locator('.resumen')).toBeVisible();
  await page.clock.fastForward(1);
  await expect(page.locator('.resumen')).toHaveCount(0);
});

test('failed media retries without a new multimedia event', async ({ page }) => {
  let attempts = 0;
  snapshot.multimedia = [{ id: 1, titulo: 'Video recuperable', orden: 1, url: '/uploads/retry.mp4' }];
  await page.route('**/uploads/retry.mp4*', route => { attempts++; return route.fulfill({ status: 503, body: '' }); });
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await open(page);
  await expect(page.getByText('Contenido no disponible')).toBeVisible();
  const before = attempts;
  await page.clock.fastForward(30001);
  await expect.poll(() => attempts).toBeGreaterThan(before);
});

test('TV composition fits intermediate desktop and 720p viewports', async ({ page }) => {
  await open(page);
  for (const size of [{ width: 1600, height: 900 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(size);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await page.evaluate(() => {
      const stage = document.querySelector('.main-stage').getBoundingClientRect();
      const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
      return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, left: stage.left, bottom: sidebar.bottom, childrenFit: [...document.querySelector('.sidebar').children].every(el => el.getBoundingClientRect().bottom <= sidebar.bottom + 1) };
    });
    expect(layout.width).toBe(size.width);
    expect(layout.height).toBe(size.height);
    expect(layout.left).toBeGreaterThanOrEqual(size.width * 0.05 - 1);
    expect(layout.bottom).toBeLessThan(size.height);
    expect(layout.childrenFit).toBe(true);
  }
  await page.screenshot({ path: 'test-results/tv-720p.png' });
});

test('TV demo previews states and FIFO locally without HTTP API or sockets', async ({ page }) => {
  const network = [];
  page.on('websocket', socket => { if (socket.url().includes('socket.io')) network.push(socket.url()); });
  await page.route('**/api/**', route => { network.push(route.request().url()); return route.abort(); });
  await page.goto('/tv/?demo=1');
  await expect(page.getByText('Vista demo', { exact: true })).toBeVisible();
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole('button', { name: 'Ráfaga de 3', exact: true }).click();
  for (const name of ['Lucía Morales', 'Mateo Navarro', 'María-José Sánchez']) {
    await expect(page.locator('.checkin-copy h1')).toHaveText(name);
    await page.clock.fastForward(4000);
  }
  await expect(page.locator('.resumen')).toBeVisible();
  await page.getByRole('button', { name: 'Multimedia', exact: true }).click();
  await expect(page.locator('.institutional-art')).toBeVisible();
  await page.getByRole('button', { name: 'Reconexión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reconectando...' })).toBeVisible();
  await page.getByRole('button', { name: 'Restablecer', exact: true }).click();
  await page.getByRole('button', { name: 'Resumen', exact: true }).click();
  await expect(page.locator('.summary-page')).toContainText('Página 1 de 4');
  await page.screenshot({ path: 'test-results/demo-tv.png' });
  expect(network).toEqual([]);
});
