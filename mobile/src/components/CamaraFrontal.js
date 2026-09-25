// Cámara frontal con guía ovalada. Devuelve la URI de la foto ya comprimida.
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { comprimir } from '../services/imagen';
import { Boton, Pantalla, Texto, colores } from './ui';

export default function CamaraFrontal({ instruccion, textoBoton = 'Tomar foto', onFoto }) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef(null);
  const [tomando, setTomando] = useState(false);

  if (!permiso) return <Pantalla />;
  if (!permiso.granted) {
    return (
      <Pantalla>
        <Texto>Necesitamos la cámara para tomar tu foto. Solo se usa para verificar tu asistencia.</Texto>
        <Boton titulo="Dar permiso" onPress={pedirPermiso} />
      </Pantalla>
    );
  }

  async function tomar() {
    try {
      setTomando(true);
      const foto = await camara.current.takePictureAsync({ quality: 0.8 });
      onFoto(await comprimir(foto.uri));
    } finally {
      setTomando(false);
    }
  }

  return (
    <View style={estilos.contenedor}>
      <CameraView ref={camara} style={StyleSheet.absoluteFill} facing="front" />
      <View style={estilos.ovalo} pointerEvents="none" />
      <View style={estilos.panel}>
        <Texto style={estilos.instruccion}>{instruccion}</Texto>
        <Boton titulo={textoBoton} onPress={tomar} cargando={tomando} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000' },
  ovalo: {
    position: 'absolute', alignSelf: 'center', top: '15%', width: 240, height: 320,
    borderRadius: 160, borderWidth: 3, borderColor: colores.blanco,
  },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, gap: 12, backgroundColor: 'rgba(0,0,0,0.55)' },
  instruccion: { color: colores.blanco, textAlign: 'center' },
});
