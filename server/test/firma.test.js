// Pruebas de la verificación de firma (src/services/firma.js).
// Es el corazón de la seguridad del checador: si esto pasa, cualquiera puede
// registrar la asistencia de otro. No necesita base de datos ni teléfono.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { limpiarBase64, llaveAPem, validarLlavePublica, verificarFirma } from '../src/services/firma.js';

// Simula react-native-biometrics: RSA 2048, pública en base64 X.509 y firma SHA256withRSA.
function nuevoTelefono() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    llavePublica: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    firmar: (texto) => crypto.sign('RSA-SHA256', Buffer.from(texto, 'utf8'), privateKey).toString('base64'),
  };
}

describe('validarLlavePublica', () => {
  it('acepta una RSA 2048 como la devuelve la librería', () => {
    assert.equal(validarLlavePublica(nuevoTelefono().llavePublica), true);
  });

  it('acepta la llave con saltos de línea (la librería a veces los manda)', () => {
    const { llavePublica } = nuevoTelefono();
    const conSaltos = `${llavePublica.slice(0, 40)}\n${llavePublica.slice(40, 120)}\n${llavePublica.slice(120)}`;
    assert.equal(validarLlavePublica(conSaltos), true);
  });

  it('rechaza basura', () => {
    assert.throws(() => validarLlavePublica('no-es-una-llave'));
  });
});

describe('verificarFirma', () => {
  const reto = 'c3f1a9e0-5b1c-4c6e-9d7a-2f0e8b6a1d44';

  it('acepta la firma del reto exacto', () => {
    const tel = nuevoTelefono();
    assert.equal(verificarFirma({ llavePublica: tel.llavePublica, payload: reto, firma: tel.firmar(reto) }), true);
  });

  it('rechaza si se altera un solo carácter del reto', () => {
    const tel = nuevoTelefono();
    const firma = tel.firmar(reto);
    assert.equal(verificarFirma({ llavePublica: tel.llavePublica, payload: `${reto}x`, firma }), false);
    assert.equal(verificarFirma({ llavePublica: tel.llavePublica, payload: reto.toUpperCase(), firma }), false);
  });

  it('rechaza la firma de otro teléfono (llave de otra persona)', () => {
    const juan = nuevoTelefono();
    const maria = nuevoTelefono();
    assert.equal(verificarFirma({ llavePublica: maria.llavePublica, payload: reto, firma: juan.firmar(reto) }), false);
  });

  it('rechaza firma vacía o corrupta sin lanzar excepción', () => {
    const tel = nuevoTelefono();
    assert.equal(verificarFirma({ llavePublica: tel.llavePublica, payload: reto, firma: '' }), false);
    assert.equal(verificarFirma({ llavePublica: tel.llavePublica, payload: reto, firma: 'no-es-base64!!' }), false);
  });

  it('acepta la firma aunque venga con saltos de línea', () => {
    const tel = nuevoTelefono();
    const firma = tel.firmar(reto);
    const firmaConSaltos = firma.replace(/(.{40})/g, '$1\n');
    assert.equal(verificarFirma({ llavePublica: tel.llavePublica, payload: reto, firma: firmaConSaltos }), true);
  });
});

describe('utilidades de base64', () => {
  it('limpiarBase64 quita espacios y saltos de línea', () => {
    assert.equal(limpiarBase64('MIIB\nIjAN  Bgkq'), 'MIIBIjANBgkq');
  });

  it('llaveAPem arma un PEM con líneas de 64 caracteres', () => {
    const pem = llaveAPem(nuevoTelefono().llavePublica);
    assert.match(pem, /^-----BEGIN PUBLIC KEY-----\n/);
    assert.match(pem, /\n-----END PUBLIC KEY-----\n$/);
    for (const linea of pem.trim().split('\n').slice(1, -1)) {
      assert.ok(linea.length <= 64, `línea demasiado larga: ${linea.length}`);
    }
  });
});
