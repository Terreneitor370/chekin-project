// Datos del usuario vinculado, guardados cifrados en el teléfono (expo-secure-store).
import * as SecureStore from 'expo-secure-store';

const CLAVE = 'checador.sesion';

export async function leerSesion() {
  const texto = await SecureStore.getItemAsync(CLAVE);
  return texto ? JSON.parse(texto) : null; // { empleadoId, nombre, huellaRegistrada, fotoRegistrada }
}

export async function guardarSesion(datos) {
  const actual = (await leerSesion()) ?? {};
  const nueva = { ...actual, ...datos };
  await SecureStore.setItemAsync(CLAVE, JSON.stringify(nueva));
  return nueva;
}

export async function borrarSesion() {
  await SecureStore.deleteItemAsync(CLAVE);
}
