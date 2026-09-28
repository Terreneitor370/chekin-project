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
  crearMultimedia,
  checkinsQuery,
  idParam,
  login,
  registrarBiometria,
  reporteAsistencia,
  retoQuery,
  vincular,
} from '../src/validacion.js';

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
    firma: 'ZG9DaGFuZ2UK',
    idempotencyKey: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  };

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
