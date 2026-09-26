import { z } from 'zod';
import { es } from 'zod/locales';

// zod trae los mensajes en inglés y la app los muestra al usuario final, así que
// se configura el locale español (docs/api.md: el campo "mensaje" va en español).
z.config(es());

// Cada esquema refleja una tabla de database/schema.sql y una sección de docs/api.md.
// Lo que no se valida aquí lo termina rechazando MySQL con un 500 feo; con zod el
// cliente recibe 400 DATOS_INVALIDOS con el nombre del campo que falló.

// --- primitivas reutilizables ------------------------------------------------
// En multipart todos los campos llegan como texto, por eso se usa coerce.
const id = z.coerce.number({ error: 'debe ser un número' }).int('debe ser un entero').positive('debe ser mayor que 0');
const texto = (max, etiqueta) =>
  z.string({ error: `falta ${etiqueta}` }).trim().min(1, `${etiqueta} está vacío`).max(max, `máximo ${max} caracteres`);

// YYYY-MM-DD que además existe de verdad en el calendario: 2026-13-45 no pasa.
const fecha = z
  .string({ error: 'falta la fecha' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'usa el formato AAAA-MM-DD')
  .refine((s) => {
    const [a, m, d] = s.split('-').map(Number);
    const f = new Date(Date.UTC(a, m - 1, d));
    return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
  }, 'esa fecha no existe');

const hora = z.string({ error: 'falta la hora' }).trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'usa el formato HH:MM en 24 horas');
const correo = z.email('el correo no tiene un formato válido').max(120, 'máximo 120 caracteres');

// El panel manda booleanos, pero un <form> llega como "0"/"1"/"true"/"false".
// (z.coerce.boolean() no sirve: convierte cualquier texto no vacío en true.)
const booleano = z
  .union([z.boolean(), z.literal(0), z.literal(1), z.enum(['0', '1', 'true', 'false'])])
  .transform((v) => v === true || v === 1 || v === '1' || v === 'true');

// --- 2. Autenticación del panel ---------------------------------------------
export const login = z.object({
  email: correo,
  password: z.string({ error: 'falta la contraseña' }).min(1, 'la contraseña está vacía'),
});

// --- 3. Registro del celular -------------------------------------------------
export const vincular = z.object({
  codigo: z.string({ error: 'falta el código' }).trim().regex(/^\d{6}$/, 'el código debe tener 6 dígitos'),
});

export const registrarBiometria = z.object({
  // base64 X.509 de una RSA 2048: ~400 caracteres, la librería puede mandar saltos de línea
  llavePublica: z
    .string({ error: 'falta la llave pública' })
    .min(1, 'la llave pública está vacía')
    .max(8192, 'la llave pública es demasiado larga'),
  dispositivo: z.string().trim().max(120, 'máximo 120 caracteres').optional(),
});

// --- 4. Check-in ------------------------------------------------------------
export const retoQuery = z.object({
  empleadoId: id,
});

// Los archivos (selfie) los revisa multer + exigirImagen; aquí solo los campos de texto.
export const checkin = z.object({
  empleadoId: id,
  retoId: id,
  // firma SHA256withRSA de 2048 bits = 256 bytes = ~344 en base64
  firma: z
    .string({ error: 'falta la firma' })
    .min(1, 'la firma está vacía')
    .max(4096, 'la firma es demasiado larga'),
  idempotencyKey: z.uuid('el idempotencyKey debe ser un UUID'), // CHAR(36) UNIQUE en la BD
});

// --- 6. Panel admin ---------------------------------------------------------
// El token de la TV no se valida aquí a propósito: un token faltante o vencido es
// 401 NO_AUTENTICADO según docs/api.md, no 400.
export const idParam = z.object({ id });

export const crearEmpleado = z.object({
  nombre: texto(120, 'el nombre'),
  email: correo.nullable().optional(),
  horaEntrada: hora.default('08:00'),
  toleranciaMin: z.coerce.number({ error: 'debe ser un número' }).int('debe ser un entero').min(0, 'no puede ser negativo').max(65535, 'máximo 65535').default(10),
});

// Los PUT usan COALESCE en SQL: un campo ausente no se toca.
export const actualizarEmpleado = z.object({
  nombre: texto(120, 'el nombre').optional(),
  email: correo.nullable().optional(),
  horaEntrada: hora.optional(),
  toleranciaMin: z.coerce.number({ error: 'debe ser un número' }).int('debe ser un entero').min(0, 'no puede ser negativo').max(65535, 'máximo 65535').optional(),
  activo: booleano.optional(),
});

export const crearAviso = z.object({
  mensaje: texto(255, 'el mensaje'),
  fechaInicio: fecha.nullable().optional(),
  fechaFin: fecha.nullable().optional(),
});

export const actualizarAviso = crearAviso.partial().extend({ activo: booleano.optional() });

export const crearMultimedia = z.object({
  titulo: texto(120, 'el título').default('Video'),
  orden: z.coerce.number({ error: 'debe ser un número' }).int('debe ser un entero').min(0, 'no puede ser negativo').max(65535, 'máximo 65535').default(1),
});

export const actualizarMultimedia = z.object({
  titulo: texto(120, 'el título').optional(),
  orden: z.coerce.number({ error: 'debe ser un número' }).int('debe ser un entero').min(0, 'no puede ser negativo').max(65535, 'máximo 65535').optional(),
  activo: booleano.optional(),
});

// --- Reportes y consultas del día -------------------------------------------
export const checkinsQuery = z.object({
  fecha: fecha.optional(), // si no viene, la ruta usa la fecha de negocio de hoy
});

export const reporteAsistencia = z.object({
  desde: fecha,
  hasta: fecha,
  formato: z.enum(['json', 'csv'], 'solo se admite json o csv').default('json'),
});
