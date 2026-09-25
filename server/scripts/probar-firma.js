// Simula lo que hace react-native-biometrics en el teléfono para probar la verificación sin celular.
// Uso: npm run probar-firma
//      npm run probar-firma -- <llavePublicaBase64> <reto> <firmaBase64>   (valores reales enviados por /mobile)
import crypto from 'node:crypto';
import { verificarFirma } from '../src/services/firma.js';

const [llave, reto, firma] = process.argv.slice(2);

if (llave && reto && firma) {
  console.log('Firma válida:', verificarFirma({ llavePublica: llave, payload: reto, firma }));
  process.exit(0);
}

// 1. "Teléfono": crea RSA 2048 y exporta la pública como base64 X.509 (igual que la librería)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const llavePublica = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

// 2. "Servidor": genera un reto
const retoPrueba = crypto.randomUUID();

// 3. "Teléfono": firma el reto con SHA256withRSA
const firmaPrueba = crypto.sign('RSA-SHA256', Buffer.from(retoPrueba), privateKey).toString('base64');

console.log('Llave pública (base64):', `${llavePublica.slice(0, 40)}...`);
console.log('Reto:', retoPrueba);
console.log('Firma válida (debe ser true):', verificarFirma({ llavePublica, payload: retoPrueba, firma: firmaPrueba }));
console.log('Reto alterado (debe ser false):', verificarFirma({ llavePublica, payload: `${retoPrueba}x`, firma: firmaPrueba }));
