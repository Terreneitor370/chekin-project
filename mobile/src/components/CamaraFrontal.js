// Cámara frontal con guía ovalada. Devuelve la URI de la foto ya comprimida.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { comprimir } from '../services/imagen';
import { Boton, Pantalla, Tarjeta, Texto, colores } from './ui';

export default function CamaraFrontal({ titulo = 'Mira a la cámara', instruccion, textoBoton = 'Tomar foto', onFoto }) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef(null);
  const [tomando, setTomando] = useState(false);

  // Pulso suave del óvalo: invita a acercar el rostro en vez de un aro estático.
  const pulso = useSharedValue(0);
  useEffect(() => {
    pulso.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulso]);
  const estiloOvalo = useAnimatedStyle(() => ({
    opacity: 0.55 + pulso.value * 0.45,
    transform: [{ scale: 0.97 + pulso.value * 0.03 }],
  }));

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
      <Animated.View style={[estilos.ovalo, estiloOvalo]} pointerEvents="none" />
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
