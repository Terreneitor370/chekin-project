// Huella con react-native-biometrics.
// - createKeys(): crea un par de llaves RSA 2048 en el chip seguro del teléfono, protegidas por la huella.
//   La privada nunca sale del teléfono; la pública (base64) se guarda en la BD ligada al usuario.
//   (En Android no muestra el diálogo; por eso el registro firma una prueba justo después.)
// - createSignature(): pide la huella y firma el reto con SHA256withRSA.
// Nota: en muchos Android (incluido Oppo/ColorOS) el desbloqueo facial es biometría "débil"
// y no sirve para firmar; se usará la huella. El rostro lo verifica DeepFace en el servidor.
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

export async function sensorDisponible() {
  const { available, biometryType, error } = await rnBiometrics.isSensorAvailable();
  return { disponible: Boolean(available), tipo: biometryType ?? null, error: error ?? null };
}

export async function crearLlaves() {
  // Si ya había llaves (registro anterior), se reemplazan
  const { keysExist } = await rnBiometrics.biometricKeysExist();
  if (keysExist) await rnBiometrics.deleteKeys();
  const { publicKey } = await rnBiometrics.createKeys();
  return publicKey;
}

export async function llavesExisten() {
  const { keysExist } = await rnBiometrics.biometricKeysExist();
  return keysExist;
}

// Devuelve la firma en base64 o lanza un error si el usuario cancela
export async function firmar(payload, promptMessage = 'Confirma tu huella para checar') {
  const { success, signature, error } = await rnBiometrics.createSignature({
    promptMessage,
    payload,
    cancelButtonText: 'Cancelar',
  });
  if (!success || !signature) {
    throw new Error(error === 'User cancellation' ? 'Cancelaste la huella.' : 'No se pudo leer tu huella.');
  }
  return signature;
}
