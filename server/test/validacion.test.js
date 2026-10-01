// Pruebas de los esquemas de validación (src/validacion.js).
// Son puras: no tocan la base de datos ni face-service.
//   npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkin,
  crearAviso,
  crearEmpleado,
  actualizarEmpleado,
  crearUsuario,
  actualizarUsuario,
  crearMultimedia,
  checkinsQuery,
  idParam,
  login,
  miAsistencia,
  miSesion,
  registrarBiometria,
  reporteAsistencia,
  retoQuery,
  vincular,
} from '../src/validacion.js';
import { errores } from '../src/utils/errores.js';

// Devuelve el mensaje de error o null si el valor es válido.
function falla(esquema, valor) {
  const r = esquema.safeParse(valor);
  return r.success ? null : r.error.issues[0].message;
}

describe('autenticación', () => {
  it('acepta un correo y contraseña normales', () => {
    assert.equal(falla(login, { email: 'admin@checador.local', password: 'Admin123!' }), null);
  });

  it('rechaza un correo mal escrito', () => {
    assert.match(falla(login, { email: 'no-es-correo', password: 'x' }), /correo/);
  });

  it('rechaza una contraseña vacía', () => {
    assert.equal(falla(login, { email: 'a@b.com', password: '' }), 'la contraseña está vacía');
  });

  it('avisa que falta la contraseña cuando no viene', () => {
    assert.equal(falla(login, { email: 'a@b.com' }), 'falta la contraseña');
  });
});

describe('código de vinculación', () => {
  it('acepta 6 dígitos', () => {
    assert.equal(falla(vincular, { codigo: '482913' }), null);
  });

  it('rechaza menos de 6 dígitos', () => {
    assert.match(falla(vincular, { codigo: '123' }), /6 dígitos/);
  });

  it('rechaza letras', () => {
    assert.match(falla(vincular, { codigo: '48291a' }), /6 dígitos/);
  });

  it('conserva los ceros a la izquierda (es texto, no número)', () => {
    const r = vincular.safeParse({ codigo: '004821' });
    assert.equal(r.success, true);
    assert.equal(r.data.codigo, '004821');
  });

  it('avisa que falta el código cuando no viene', () => {
    assert.equal(falla(vincular, {}), 'falta el código');
  });
});

describe('biometría', () => {
  it('acepta una llave pública y un dispositivo', () => {
    assert.equal(falla(registrarBiometria, { llavePublica: 'MIIBIjANBgkq', dispositivo: 'OPPO Reno 14' }), null);
  });

  it('acepta la llave sin dispositivo (es opcional)', () => {
    assert.equal(falla(registrarBiometria, { llavePublica: 'MIIBIjANBgkq' }), null);
  });

  it('exige la llave pública con un mensaje entendible, no técnico', () => {
    assert.equal(falla(registrarBiometria, { dispositivo: 'OPPO' }), 'falta la llave pública');
  });
});

describe('reto del check-in', () => {
  it('convierte el empleadoId de texto a número (viene en el query)', () => {
    const r = retoQuery.safeParse({ empleadoId: '3' });
    assert.equal(r.success, true);
    assert.equal(r.data.empleadoId, 3);
    assert.equal(typeof r.data.empleadoId, 'number');
  });

  it('rechaza empleadoId 0, negativo, decimal o texto', () => {
    for (const malo of ['0', '-1', '2.5', 'tres', undefined]) {
      assert.notEqual(falla(retoQuery, { empleadoId: malo }), null, `debería rechazar ${malo}`);
    }
  });
});

describe('check-in', () => {
  const valido = {
    empleadoId: 3,
    retoId: 1542,
    tipo: 'entrada',
    firma: 'ZG9DaGFuZ2UK',
    idempotencyKey: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  };

  it('exige que tipo sea entrada o salida', () => {
    assert.match(falla(checkin, { ...valido, tipo: 'almuerzo' }), /entrada o salida/);
    assert.notEqual(falla(checkin, { ...valido, tipo: undefined }), null);
  });

  it('acepta un intento bien formado', () => {
    assert.equal(falla(checkin, valido), null);
  });

  it('convierte los ids que llegan como texto de multipart', () => {
    const r = checkin.safeParse({ ...valido, empleadoId: '3', retoId: '1542' });
    assert.equal(r.success, true);
    assert.equal(r.data.empleadoId, 3);
    assert.equal(r.data.retoId, 1542);
  });

  it('exige un idempotencyKey que sea UUID (es CHAR(36) UNIQUE)', () => {
    assert.match(falla(checkin, { ...valido, idempotencyKey: 'abc-123' }), /UUID/);
    assert.match(falla(checkin, { ...valido, idempotencyKey: 'x'.repeat(60) }), /UUID/);
  });

  it('exige la firma con un mensaje entendible, no técnico', () => {
    assert.equal(falla(checkin, { ...valido, firma: undefined }), 'falta la firma');
    assert.match(falla(checkin, { ...valido, firma: '' }), /vacía/);
  });

  it('ignora campos extra en vez de guardarlos', () => {
    const r = checkin.safeParse({ ...valido, verificado: 1, distancia: 0.1 });
    assert.equal(r.success, true);
    assert.equal('verificado' in r.data, false);
    assert.equal('distancia' in r.data, false);
  });
});

describe('empleados', () => {
  it('aplica los valores por defecto del contrato', () => {
    const r = crearEmpleado.safeParse({ nombre: 'Kassandra Cuadras' });
    assert.equal(r.success, true);
    assert.equal(r.data.horaEntrada, '08:00');
    assert.equal(r.data.toleranciaMin, 10);
  });

  it('acepta acentos en el nombre y los conserva', () => {
    const r = crearEmpleado.safeParse({ nombre: 'Jeshua E. Pérez' });
    assert.equal(r.data.nombre, 'Jeshua E. Pérez');
  });

  it('rechaza una hora que no existe', () => {
    for (const mala of ['25:00', '8:00', '08:60', 'mañana', '08:00:00']) {
      assert.notEqual(falla(crearEmpleado, { nombre: 'X', horaEntrada: mala }), null, `debería rechazar ${mala}`);
    }
  });

  it('rechaza tolerancias negativas o fuera de rango', () => {
    assert.notEqual(falla(crearEmpleado, { nombre: 'X', toleranciaMin: -1 }), null);
    assert.notEqual(falla(crearEmpleado, { nombre: 'X', toleranciaMin: 70000 }), null);
  });

  it('acepta tolerancias de 0 a 20 y las recorta a numero', () => {
    for (const t of [0, 5, 10, 20, '15']) {
      assert.equal(falla(crearEmpleado, { nombre: 'X', toleranciaMin: t }), null, `debía aceptar ${t}`);
    }
    // el tope es 20: con la columna smallint se podían pedir 1440 min (un día entero)
    assert.match(falla(crearEmpleado, { nombre: 'X', toleranciaMin: 21 }), /20 minutos/);
  });

  it('rechaza tolerancias no enteras o no numéricas', () => {
    assert.notEqual(falla(crearEmpleado, { nombre: 'X', toleranciaMin: 10.5 }), null);
    assert.notEqual(falla(crearEmpleado, { nombre: 'X', toleranciaMin: 'mucho' }), null);
  });
});

// El nombre de una persona solo lleva letras (con acentos y ñ), espacios, apóstrofos,
// guiones y puntos iniciales. Sin esto, "kas!!#^@kfn" entraba como nombre de empleado.
describe('nombre de persona', () => {
  it('acepta los nombres reales del equipo, con acentos e iniciales', () => {
    for (const n of [
      'Isabel Celis', 'Kassandra Cuadras', 'Jorge Ramírez', 'Jeshua E. Pérez',
      'Empleado Demo', 'Kassie CA', 'María-José Sánchez', "O'Brien Ángel", 'Ñuño Núñez',
      'Ana María de los Ángeles', 'O. Wilde', 'E. Pérez', 'J. K. Rowling', "O'Brien",
      'Caleb O’Neal',
    ]) {
      assert.equal(falla(crearEmpleado, { nombre: n }), null, `debía aceptar "${n}"`);
    }
  });

  it('rechaza símbolos, dígitos y HTML en el nombre', () => {
    for (const n of [
      'kas!!#^@kfn', 'kass@gmail.com', 'Pedro123', 'Ana<>María', '<script>alert(1)</script>',
      'Ana María-', '--Ana', '!!!', 'user@admin', 'Juan/Pedro',
    ]) {
      assert.notEqual(falla(crearEmpleado, { nombre: n }), null, `debía rechazar "${n}"`);
    }
  });

  it('rechaza puntos sueltos o al final del nombre', () => {
    for (const n of ['Ana María.', 'Jeshua E. . Pérez', 'Jeshua E.. Pérez', '...']) {
      assert.notEqual(falla(crearEmpleado, { nombre: n }), null, `debía rechazar "${n}"`);
    }
  });

  it('rechaza dos espacios seguidos', () => {
    assert.notEqual(falla(crearEmpleado, { nombre: 'Juan  Pérez' }), null);
  });

  it('aplica las mismas reglas al editar', () => {
    assert.notEqual(falla(actualizarEmpleado, { nombre: 'kas!!#' }), null);
    assert.equal(falla(actualizarEmpleado, { nombre: 'Jeshua E. Pérez' }), null);
  });

  it('exige el nombre', () => {
    assert.match(falla(crearEmpleado, {}), /nombre/);
  });

  it('acepta email nulo (el empleado puede no tener correo)', () => {
    assert.equal(falla(crearEmpleado, { nombre: 'X', email: null }), null);
  });

  // El formulario del panel manda email: "" si el campo se deja vacío; sin esto
  // el alta de un empleado sin correo da 400 "el correo no tiene un formato válido".
  it('convierte email "" a null, porque el campo está vacío en el formulario', () => {
    const r = crearEmpleado.safeParse({ nombre: 'Kassandra Cuadras', email: '' });
    assert.equal(r.success, true, `rechazó el email vacío: ${r.error?.issues[0]?.message}`);
    assert.equal(r.data.email, null);
  });

  it('convierte email de solo espacios a null', () => {
    const r = crearEmpleado.safeParse({ nombre: 'X', email: '   ' });
    assert.equal(r.success, true);
    assert.equal(r.data.email, null);
  });

  it('lo mismo al actualizar, para no perder el PUT del panel', () => {
    const r = actualizarEmpleado.safeParse({ email: '' });
    assert.equal(r.success, true, `rechazó el email vacío: ${r.error?.issues[0]?.message}`);
    assert.equal(r.data.email, null);
  });

  it('sigue rechazando un correo de verdad mal escrito', () => {
    assert.match(falla(crearEmpleado, { nombre: 'X', email: 'no-es-correo' }), /correo/);
    assert.match(falla(actualizarEmpleado, { email: 'no-es-correo' }), /correo/);
  });

  it('acepta un correo válido y lo conserva', () => {
    const r = crearEmpleado.safeParse({ nombre: 'X', email: 'kassandra@checador.local' });
    assert.equal(r.success, true);
    assert.equal(r.data.email, 'kassandra@checador.local');
  });
});

// "Mi asistencia" (docs/api.md 4.1). Sin fechas son los últimos 7 días, y el
// empleado sale del token, así que aquí no hay ningún id en los parámetros.
describe('mi asistencia', () => {
  it('pide empleadoId, retoId y firma para abrir la sesión', () => {
    // el campo que falló va en path, el mensaje es genérico ("debe ser un número")
    const campos = (v) => miSesion.safeParse(v).error.issues.map((i) => i.path.join('.'));
    assert.ok(campos({}).includes('empleadoId'));
    assert.ok(campos({}).includes('retoId'));
    assert.match(falla(miSesion, { empleadoId: 1, retoId: 1 }), /firma/);
    assert.equal(falla(miSesion, { empleadoId: 3, retoId: 1543, firma: 'abc' }), null);
  });

  it('acepta el rango por defecto, sin fechas', () => {
    assert.equal(falla(miAsistencia, {}), null);
  });

  it('acepta un rango con los dos bordes', () => {
    assert.equal(falla(miAsistencia, { desde: '2026-09-01', hasta: '2026-09-29' }), null);
  });

  it('rechaza fechas al revés', () => {
    assert.notEqual(falla(miAsistencia, { desde: '2026-09-29', hasta: '2026-09-01' }), null);
  });

  it('rechaza rangos de más de un año', () => {
    assert.notEqual(falla(miAsistencia, { desde: '2024-01-01', hasta: '2026-01-01' }), null);
  });

  it('rechaza fechas que no existen', () => {
    assert.notEqual(falla(miAsistencia, { desde: '2026-13-45' }), null);
    assert.notEqual(falla(miAsistencia, { hasta: '2026-02-30' }), null);
  });
});

// El UNIQUE de empleados.email lo vigila la ruta (src/routes/empleados.js), que
// devuelve 409 EMAIL_DUPLICADO en vez de dejar subir el ER_DUP_ENTRY de MySQL como
// 500. Aquí se comprueba que el error existe y tiene la forma del contrato.
describe('correo duplicado', () => {
  it('el error de correo duplicado es 409 EMAIL_DUPLICADO con mensaje en español', () => {
    const e = errores.emailDuplicado();
    assert.equal(e.status, 409);
    assert.equal(e.codigo, 'EMAIL_DUPLICADO');
    // el texto viaja en .message; errorHandler lo serializa como "mensaje"
    assert.match(e.message, /correo/i);
  });

  it('un correo repetido no lo rechaza el esquema: eso lo decide la BD con el 409', () => {
    assert.equal(falla(crearEmpleado, { nombre: 'X', email: 'isabel@checador.local' }), null);
  });
});

// Un PUT/DELETE contra un id que no existe tiene que decir 404 y no un 200 con
// {ok:true}, que hacia que el panel mostrara "guardado" sin guardar nada. El
// comportamiento en si se comprueba contra la API viva (verificar-404.js); aqui se
// fija la forma del error que devuelve src/db.js mediante modificar().
describe('id inexistente en un PUT o DELETE', () => {
  it('el error es 404 NO_ENCONTRADO con mensaje en español', () => {
    const e = errores.noEncontrado('Empleado no encontrado');
    assert.equal(e.status, 404);
    assert.equal(e.codigo, 'NO_ENCONTRADO');
    assert.equal(e.message, 'Empleado no encontrado');
  });
});

// Usuarios.jsx de Jorge llama a PUT /api/usuarios/:id con dos cuerpos distintos:
//   editar   -> { rol, password? }
//   desactivar -> { activo: false }
// El segundo NO manda rol, asi que ningun campo puede ser obligatorio aqui.
describe('usuarios del panel', () => {
  it('crear exige correo, contraseña de 8+ y rol válido', () => {
    assert.equal(falla(crearUsuario, { email: 'nuevo@checador.local', password: 'Clave123!', rol: 'supervisor' }), null);
    assert.match(falla(crearUsuario, { email: 'nuevo@checador.local', password: 'corta7', rol: 'supervisor' }), /8 caracteres/);
    assert.match(falla(crearUsuario, { email: 'no-correo', password: 'Clave123!' }), /correo/);
  });

  it('si no viene rol, por defecto es supervisor', () => {
    const r = crearUsuario.safeParse({ email: 'nuevo@checador.local', password: 'Clave123!' });
    assert.equal(r.data.rol, 'supervisor');
  });

  it('rechaza un rol que no sea admin o supervisor', () => {
    assert.match(falla(crearUsuario, { email: 'x@y.com', password: 'Clave123!', rol: 'empleado' }), /rol/);
  });

  it('el boton desactivar: { activo: false } sin rol NO da 400', () => {
    // Este es el caso que pidio Claudio: si rol fuera obligatorio, el panel tronaria.
    const r = actualizarUsuario.safeParse({ activo: false });
    assert.equal(r.success, true, `rechazo desactivar: ${r.error?.issues[0]?.message}`);
    assert.equal(r.data.activo, false);
    assert.equal('rol' in r.data, false, 'rol debe quedar ausente, no en null');
  });

  it('el formulario editar: { rol, password? } sin activo NO da 400', () => {
    assert.equal(falla(actualizarUsuario, { rol: 'admin' }), null);
    assert.equal(falla(actualizarUsuario, { rol: 'admin', password: 'NuevaClave1!' }), null);
  });

  it('acepta el cuerpo vacío sin quejarse (el panel puede mandar solo activo)', () => {
    assert.equal(falla(actualizarUsuario, {}), null);
  });

  it('activo acepta 0/1 y true/false del formulario', () => {
    for (const v of [0, 1, true, false, '0', '1', 'true', 'false']) {
      assert.equal(falla(actualizarUsuario, { activo: v }), null, `rechazo activo=${v}`);
    }
  });

  it('el PUT sigue rechazando un rol o contraseña invalidos si vienen', () => {
    assert.match(falla(actualizarUsuario, { rol: 'empleado' }), /rol/);
    assert.match(falla(actualizarUsuario, { password: 'corta' }), /8 caracteres/);
  });
});

describe('avisos', () => {
  it('acepta un aviso sin fechas', () => {
    assert.equal(falla(crearAviso, { mensaje: 'Reunión a las 3 pm' }), null);
  });

  it('rechaza un mensaje en blanco', () => {
    assert.match(falla(crearAviso, { mensaje: '   ' }), /vacío/);
  });

  it('rechaza una fecha con el formato correcto pero inexistente', () => {
    assert.match(falla(crearAviso, { mensaje: 'X', fechaInicio: '2026-13-45' }), /no existe/);
    assert.match(falla(crearAviso, { mensaje: 'X', fechaInicio: '2026-02-30' }), /no existe/);
  });

  it('acepta 29 de febrero en un año bisiesto', () => {
    assert.equal(falla(crearAviso, { mensaje: 'X', fechaInicio: '2024-02-29' }), null);
  });

  it('acepta una fecha normal', () => {
    assert.equal(falla(crearAviso, { mensaje: 'X', fechaInicio: '2026-12-31' }), null);
  });
});

describe('multimedia', () => {
  it('aplica título y orden por defecto', () => {
    const r = crearMultimedia.safeParse({});
    assert.equal(r.success, true);
    assert.equal(r.data.titulo, 'Video');
    assert.equal(r.data.orden, 1);
  });
});

describe('consultas y reportes', () => {
  it('acepta checkins sin fecha (la ruta usa el día de hoy)', () => {
    assert.equal(falla(checkinsQuery, {}), null);
  });

  it('rechaza una fecha de check-in que no existe', () => {
    assert.match(falla(checkinsQuery, { fecha: 'basura' }), /AAAA-MM-DD/);
  });

  it('exige desde y hasta en el reporte', () => {
    assert.notEqual(falla(reporteAsistencia, { desde: '2026-09-01' }), null);
    assert.notEqual(falla(reporteAsistencia, { hasta: '2026-09-25' }), null);
    assert.equal(falla(reporteAsistencia, { desde: '2026-09-01', hasta: '2026-09-25' }), null);
  });

  it('acepta solo json o csv como formato', () => {
    assert.match(falla(reporteAsistencia, { desde: '2026-09-01', hasta: '2026-09-25', formato: 'pdf' }), /json o csv/);
  });

  it('rechaza un id de ruta que no es número', () => {
    assert.notEqual(falla(idParam, { id: 'abc' }), null);
    assert.equal(falla(idParam, { id: '7' }), null);
  });
});
