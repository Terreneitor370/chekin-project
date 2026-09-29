import { test, expect } from '@playwright/test';

async function backend(page, role = 'admin') {
  const state = {
    calls: [], fail: null,
    empleados: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, nombre: ['Isabel Celis', 'Jorge Ramírez', 'Kassandra Cuadras', 'Jeshua Pérez', 'Ana Martínez', 'Luis García', 'María López', 'Diego Torres', 'Sofía Romero', 'Daniel Ríos', 'Andrea Ruiz'][i], email: `persona${i + 1}@empresa.com`, horaEntrada: '08:00', toleranciaMin: 10, tieneHuella: i % 3 !== 0, tieneFoto: i % 3 !== 0, activo: true })),
    avisos: [{ id: 1, mensaje: 'Reunión de equipo a las 3:00 pm. ¡Nos vemos!', activo: true }],
    multimedia: [{ id: 1, titulo: 'Bienvenidos a nuestro equipo', orden: 1, activo: true, url: '/uploads/intro.mp4' }, { id: 2, titulo: 'Nuestra cultura', orden: 2, activo: false, url: '/uploads/cultura.mp4' }],
    usuarios: [{ id: 1, email: 'admin@empresa.com', rol: 'admin', activo: true }, { id: 2, email: 'supervisor@empresa.com', rol: 'supervisor', activo: true }],
  };
  const registros = state.empleados.slice(0, 7).map((e, i) => ({ id: i + 1, empleadoId: e.id, nombre: e.nombre, registradoEn: `2026-09-28T${i % 2 ? '15' : '14'}:${String(i * 8).padStart(2, '0')}:00.000Z`, tipo: 'entrada', tarde: i === 3, verificado: true, esReal: true, distancia: 0.25 + i / 100 }));
  await page.route('**/api/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api', ''); const method = req.method();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const json = data => route.fulfill({ json: data });
    const body = req.headers()['content-type']?.includes('application/json') ? req.postDataJSON() : req.postData();
    state.calls.push({ path, method, body, search: url.search, headers: req.headers() });
    if (state.fail === path) return route.fulfill({ status: 503, json: { error: { mensaje: 'Servicio temporalmente no disponible' } } });
    if (path === '/auth/login') return body.password === 'incorrecta' ? route.fulfill({ status: 401, json: { error: { mensaje: 'Credenciales incorrectas' } } }) : json({ token: 'test-jwt', usuario: { id: 1, email: `${role}@empresa.com`, rol: role } });
    if (req.headers().authorization !== 'Bearer test-jwt') return route.fulfill({ status: 401, json: { error: { mensaje: 'Sin sesión' } } });
    if (path === '/checkins') return json(registros);
    if (path === '/reportes/asistencia') return json(registros);
    if (/\/empleados\/\d+\/codigo/.test(path)) return json({ codigo: '048291', expiraEn: new Date(Date.now() + 900000).toISOString() });
    const [, collection, rawId] = path.split('/'); const id = Number(rawId); const rows = state[collection];
    if (!Array.isArray(rows)) return route.fulfill({ status: 404, json: { error: { mensaje: 'Ruta no documentada' } } });
    if (method === 'GET') return json(rows);
    if (method === 'POST') {
      if (collection === 'multimedia') rows.push({ id: 3, titulo: 'Video nuevo', orden: 3, activo: true, url: '/uploads/new.mp4' });
      else rows.push({ id: 50, ...body, activo: true });
      return route.fulfill({ status: 201, json: { ok: true } });
    }
    if (method === 'PUT') Object.assign(rows.find(r => r.id === id), body);
    if (method === 'DELETE') rows.find(r => r.id === id).activo = false;
    return route.fulfill({ status: 204 });
  });
  return state;
}
async function login(page, path = '/admin/') {
  await page.goto(path);
  await page.getByLabel('Correo electrónico').fill('admin@empresa.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('correcta123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

test('login, session in memory, expiration and logout', async ({ page }) => {
  await backend(page);
  await page.goto('/admin/empleados');
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
  await page.getByLabel('Correo electrónico').fill('admin@empresa.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('alert')).toContainText('Credenciales incorrectas');
  await page.getByLabel('Contraseña', { exact: true }).fill('correcta123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/empleados$/);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await expect(page.locator('.stat').first().locator('strong')).toHaveText('11');
  await page.route('**/api/empleados', route => route.fulfill({ status: 401, json: { error: { mensaje: 'Sesión expirada' } } }));
  await page.getByRole('link', { name: 'Empleados', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Tu sesión expiró');
});

test('dashboard and employees: pagination, create, edit, code and deactivate', async ({ page }) => {
  const state = await backend(page);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await login(page);
  await expect(page.getByRole('heading', { name: 'Un buen día empieza aquí.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Empleados', exact: true }).click();
  await expect(page.getByText('Isabel Celis', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/empleados-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('Sofía Romero')).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo empleado' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Nombre completo').fill('Pedro Nuevo');
  await modal.getByLabel('Correo electrónico').fill('pedro@empresa.com');
  await modal.getByRole('button', { name: 'Guardar empleado' }).click();
  await expect(modal).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Buscar empleado o correo…' }).fill('Pedro');
  await expect(page.getByText('Pedro Nuevo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar a Pedro Nuevo' }).click();
  await modal.getByLabel('Hora de entrada').fill('09:00');
  await modal.getByRole('button', { name: 'Guardar empleado' }).click();
  await expect(page.getByText('09:00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Vincular', exact: true }).click();
  await modal.getByRole('button', { name: 'Generar código' }).click();
  await expect(page.getByLabel('Código de vinculación')).toHaveText('048291');
  await page.screenshot({ path: 'test-results/vinculacion-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await page.getByRole('button', { name: 'Desactivar a Pedro Nuevo' }).click();
  await modal.getByRole('button', { name: 'Desactivar', exact: true }).click();
  await expect(page.getByText('Inactivo', { exact: true })).toBeVisible();
  expect(state.calls.find(c => c.method === 'POST' && c.path === '/empleados').body).toMatchObject({ nombre: 'Pedro Nuevo', horaEntrada: '08:00', toleranciaMin: 10 });
  expect(errors).toEqual([]);
});

test('supervisor restrictions allow editing, announcements and multimedia', async ({ page }) => {
  const state = await backend(page, 'supervisor');
  await login(page, '/admin/empleados');
  await expect(page.getByRole('button', { name: 'Nuevo empleado' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Vincular', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Editar a Isabel Celis' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usuarios y accesos' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Multimedia', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Subir video', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Activar', exact: true }).click();
  expect(state.calls.some(c => c.path === '/multimedia/2' && c.method === 'PUT' && c.body.activo)).toBeTruthy();
});

test('announcements validate dates, preview, publish, edit and pause', async ({ page }) => {
  const state = await backend(page);
  await login(page, '/admin/avisos');
  await page.getByRole('button', { name: 'Nuevo aviso' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Mensaje', { exact: true }).fill('Junta mañana a las 10');
  await modal.getByLabel('Inicio (opcional)').fill('2026-10-01T10:00');
  await modal.getByLabel('Fin (opcional)').fill('2026-09-30T10:00');
  await modal.getByRole('button', { name: 'Publicar aviso' }).click();
  await expect(modal.getByRole('alert')).toContainText('posterior');
  await modal.getByLabel('Fin (opcional)').fill('2026-10-02T10:00');
  await modal.getByRole('button', { name: 'Publicar aviso' }).click();
  await expect(page.getByText('Junta mañana a las 10', { exact: true })).toBeVisible();
  expect(state.calls.find(c => c.method === 'POST' && c.path === '/avisos').body.fechaInicio).toBe('2026-10-01T17:00:00.000Z');
  await page.getByRole('button', { name: 'Editar aviso 50' }).click();
  await modal.getByLabel('Mensaje', { exact: true }).fill('Mensaje actualizado');
  await modal.getByRole('button', { name: 'Guardar cambios' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Mensaje actualizado' });
  await row.getByRole('button', { name: 'Pausar' }).click();
  await expect(row.getByText('Pausado')).toBeVisible();
  await page.screenshot({ path: 'test-results/avisos-desktop.png', fullPage: true });
});

test('multimedia: multipart upload, ordering, active selection and failure recovery', async ({ page }) => {
  const state = await backend(page);
  await login(page, '/admin/multimedia');
  await page.getByRole('button', { name: 'Mover abajo Bienvenidos a nuestro equipo' }).click();
  await expect.poll(() => state.multimedia.find(v => v.id === 1).orden).toBe(2);
  await page.getByRole('button', { name: 'Subir video', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Archivo de video').setInputFiles({ name: 'nuevo.mp4', mimeType: 'video/mp4', buffer: Buffer.from('test-upload-contract') });
  await modal.getByLabel('Título del video').fill('Video nuevo');
  state.fail = '/multimedia';
  await modal.getByRole('button', { name: 'Subir video', exact: true }).click();
  await expect(modal.getByRole('alert')).toContainText('temporalmente');
  state.fail = null;
  await modal.getByRole('button', { name: 'Subir video', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Video nuevo' })).toBeVisible();
  const upload = state.calls.find(c => c.method === 'POST' && c.path === '/multimedia');
  expect(upload.headers['content-type']).toContain('multipart/form-data; boundary=');
  expect(upload.body).toContain('name="video"');
  expect(upload.body).toContain('name="orden"');
  await page.screenshot({ path: 'test-results/multimedia-desktop.png', fullPage: true });
});

test('reports: date range without CSV export or extra biometric columns', async ({ page }) => {
  const state = await backend(page);
  await login(page, '/admin/reportes');
  await expect(page.getByText('Verificado', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Prueba de vida' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Distancia facial' })).toHaveCount(0);
  await page.getByLabel('Desde', { exact: true }).fill('2026-10-05');
  await page.getByLabel('Hasta', { exact: true }).fill('2026-10-01');
  await page.getByRole('button', { name: 'Consultar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('posterior');
  await page.getByLabel('Desde', { exact: true }).fill('2026-09-01');
  await page.getByRole('button', { name: 'Consultar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(state.calls.some(c => c.search.includes('formato=csv'))).toBe(false);
  await page.screenshot({ path: 'test-results/reportes-desktop.png', fullPage: true });
});

test('admin users and mobile layout', async ({ page }) => {
  const state = await backend(page);
  await login(page, '/admin/usuarios');
  await page.getByRole('button', { name: 'Nuevo usuario' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Correo electrónico').fill('nuevo@empresa.com');
  await modal.getByLabel('Contraseña', { exact: true }).fill('segura12345');
  await modal.getByLabel('Rol', { exact: true }).selectOption('supervisor');
  await modal.getByRole('button', { name: 'Guardar usuario' }).click();
  await expect(page.getByText('nuevo@empresa.com', { exact: true })).toBeVisible();
  expect(state.usuarios.find(u => u.email === 'nuevo@empresa.com').rol).toBe('supervisor');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  await page.getByRole('link', { name: 'Resumen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Un buen día empieza aquí.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
});

test('load failures retry without showing fabricated data', async ({ page }) => {
  const state = await backend(page); state.fail = '/empleados';
  await login(page, '/admin/empleados');
  await expect(page.getByRole('alert')).toContainText('temporalmente');
  await expect(page.getByText('Isabel Celis')).toHaveCount(0);
  state.fail = null;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Isabel Celis', { exact: true })).toBeVisible();
});
