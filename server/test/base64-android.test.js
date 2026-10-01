// Android manda la llave pública y la firma en Base64 con saltos de línea
// (Base64.DEFAULT envuelve a 64 caracteres). Estos tests simulan exactamente ese
// formato para que nadie rompa la validación sin darse cuenta: el síntoma solo
// aparece con el celular real, en la demo.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { registrarBiometria, checkin } from '../src/validacion.js';
import { limpiarBase64, verificarFirma } from '../src/services/firma.js';

// Así corta las líneas react-native-biometrics / Base64.DEFAULT
const comoAndroid = (b64) => b64.replace(/(.{64})/g, '$1\n');

function nuevoTelefono() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    privateKey,
    llavePlana: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
  };
}

describe('Base64 con saltos de línea (formato Android)', () => {
  const tel = nuevoTelefono();
  const llaveAndroid = comoAndroid(tel.llavePlana);

  it('la llave real sí trae saltos de línea y es más larga', () => {
    assert.equal(llaveAndroid.length > tel.llavePlana.length, true);
    assert.equal(llaveAndroid.includes('\n'), true);
    assert.equal(llaveAndroid.split('\n').length > 1, true);
  });

  it('el esquema de biometría acepta la llave con saltos (si no, el registro da 400)', () => {
    const r = registrarBiometria.safeParse({ llavePublica: llaveAndroid, dispositivo: 'OPPO Reno 14' });
    assert.equal(r.success, true, `rechazó la llave con saltos: ${r.error?.issues[0]?.message}`);
  });

  it('no deja pasar una llave demasiado larga', () => {
    const r = registrarBiometria.safeParse({ llavePublica: 'A'.repeat(9000) });
    assert.equal(r.success, false);
  });

  it('la firma con saltos se valida igual (si no, el check-in da 401)', () => {
    const reto = 'c3f1a9e0-5b1c-4c6e-9d7a-2f0e8b6a1d44';
    const firmaPlana = crypto.sign('RSA-SHA256', Buffer.from(reto), tel.privateKey).toString('base64');
    const firmaAndroid = comoAndroid(firmaPlana);

    assert.equal(verificarFirma({ llavePublica: tel.llavePlana, payload: reto, firma: firmaPlana }), true);
    assert.equal(verificarFirma({ llavePublica: tel.llavePlana, payload: reto, firma: firmaAndroid }), true);

    const r = checkin.safeParse({
      empleadoId: 3,
      retoId: 1542,
      firma: firmaAndroid,
      idempotencyKey: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    });
    assert.equal(r.success, true, `rechazó la firma con saltos: ${r.error?.issues[0]?.message}`);
  });

  it('limpiarBase64 deja la llave igual que sin saltos', () => {
    assert.equal(limpiarBase64(llaveAndroid), tel.llavePlana);
  });

  it('también acepta CRLF, por si algún dispositivo lo usa', () => {
    const conCrlf = tel.llavePlana.replace(/(.{64})/g, '$1\r\n');
    assert.equal(limpiarBase64(conCrlf), tel.llavePlana);
    assert.equal(verificarFirma({ llavePublica: conCrlf, payload: 'x', firma: 'y' }), false); // no explota
  });
});
