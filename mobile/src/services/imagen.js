// Comprime la foto antes de enviarla: máx. 1024 px de ancho y JPEG 70% (PDF: "Foto muy pesada").
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { FOTO } from '../config';

export async function comprimir(uri) {
  const contexto = ImageManipulator.manipulate(uri);
  contexto.resize({ width: FOTO.anchoMaximo });
  const imagen = await contexto.renderAsync();
  const resultado = await imagen.saveAsync({ compress: FOTO.calidad, format: SaveFormat.JPEG });
  return resultado.uri;
}
