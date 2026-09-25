import crypto from 'node:crypto';

// react-native-biometrics (Android) genera RSA 2048 y devuelve:
//  - llave pública: base64 de X.509 SubjectPublicKeyInfo (puede traer saltos de línea)
//  - firma: base64 de SHA256withRSA (PKCS#1 v1.5) sobre el texto del payload
// Acordado con /mobile en docs/api.md.

export function limpiarBase64(texto) {
  return String(texto ?? '').replace(/\s+/g, '');
}

export function llaveAPem(llaveBase64) {
  const limpia = limpiarBase64(llaveBase64);
  const lineas = limpia.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PUBLIC KEY-----\n${lineas.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

// Lanza si la llave no es una RSA pública válida (se usa al registrar la huella)
export function validarLlavePublica(llaveBase64) {
  const key = crypto.createPublicKey(llaveAPem(llaveBase64));
  if (key.asymmetricKeyType !== 'rsa') throw new Error('La llave no es RSA');
  return true;
}

export function verificarFirma({ llavePublica, payload, firma }) {
  try {
    return crypto.verify(
      'RSA-SHA256',
      Buffer.from(String(payload), 'utf8'),
      llaveAPem(llavePublica),
      Buffer.from(limpiarBase64(firma), 'base64'),
    );
  } catch {
    return false;
  }
}
