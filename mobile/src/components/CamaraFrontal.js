// Cámara frontal con guía ovalada. Devuelve la URI de la foto ya comprimida.
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MotiView } from 'moti';
import { comprimir } from '../services/imagen';
import { Boton, Pantalla, Tarjeta, Texto, colores } from './ui';

export default function CamaraFrontal({ titulo = 'Mira a la cámara', instruccion, textoBoton = 'Tomar foto', onFoto }) {
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
      <Tarjeta style={estilos.encabezado}>
        <View style={estilos.titulo}>
          <Ionicons name="eye-outline" size={22} color={colores.primario} />
          <Texto style={estilos.tituloTexto}>{titulo}</Texto>
        </View>
        <Texto style={estilos.instruccion}>{instruccion}</Texto>
      </Tarjeta>
      {/* Pulso suave para invitar a acercar el rostro, no un simple aro estático. */}
      <MotiView
        style={estilos.ovalo}
        pointerEvents="none"
        from={{ opacity: 0.55, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 1100, loop: true, repeatReverse: true }}
      />
      <View style={estilos.panel}>
        <Boton titulo={textoBoton} icono="camera-outline" onPress={tomar} cargando={tomando} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000' },
  encabezado: { position: 'absolute', top: 16, left: 16, right: 16, alignItems: 'center' },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tituloTexto: { fontSize: 18, fontWeight: '700' },
  instruccion: { color: colores.suave, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  ovalo: {
    position: 'absolute', alignSelf: 'center', top: '24%', width: 250, height: 330,
    borderRadius: 165, borderWidth: 3, borderColor: colores.primario,
  },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 },
});
