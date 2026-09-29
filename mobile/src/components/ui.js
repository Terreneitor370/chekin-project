import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Paleta alineada al panel-admin y la TV (mockups verdes, marca "Checker").
export const colores = {
  fondo: '#F6F9F7',
  primario: '#186B4A',
  primarioSuave: '#E3F3E9',
  acento: '#3E9C6D',
  exito: '#186B4A',
  exitoSuave: '#E3F3E9',
  advertencia: '#B7791F',
  advertenciaSuave: '#FBF1DA',
  error: '#C62828',
  errorSuave: '#FDE7E7',
  texto: '#16241C',
  suave: '#5B6E64',
  borde: '#DCE7E1',
  blanco: '#FFFFFF',
};

const TONOS = {
  primario: { fuerte: colores.primario, suave: colores.primarioSuave },
  exito: { fuerte: colores.exito, suave: colores.exitoSuave },
  advertencia: { fuerte: colores.advertencia, suave: colores.advertenciaSuave },
  error: { fuerte: colores.error, suave: colores.errorSuave },
};

// KeyboardAvoidingView en vez de solo View: el modo adjustResize del manifest
// ya no es confiable en Android con edge-to-edge (Android 15+), así que el
// desplazamiento por teclado se maneja aquí, en JS, para toda la app.
export function Pantalla({ children, style }) {
  return (
    <KeyboardAvoidingView
      style={[estilos.pantalla, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export function Titulo({ children, style }) {
  return <Text style={[estilos.titulo, style]}>{children}</Text>;
}

export function Texto({ children, style }) {
  return <Text style={[estilos.texto, style]}>{children}</Text>;
}

export function Tarjeta({ children, style }) {
  return <View style={[estilos.tarjeta, style]}>{children}</View>;
}

// Círculo grande con un icono (huella, palomita, error) rodeado de un halo suave.
// Entra con un pequeño "pop" (escala + fade) en vez de aparecer de golpe.
export function IconoEstado({ nombre, tono = 'primario', tamano = 120 }) {
  const { fuerte, suave } = TONOS[tono];
  const interior = tamano * 0.62;
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrada, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
  }, [entrada]);

  return (
    <Animated.View
      style={[
        estilos.halo,
        { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: suave },
        { opacity: entrada, transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] },
      ]}
    >
      <View style={{ width: interior, height: interior, borderRadius: interior / 2, backgroundColor: fuerte, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={nombre} size={interior * 0.55} color={colores.blanco} />
      </View>
    </Animated.View>
  );
}

// Barra "Paso 1 de 2" del registro. El relleno se desliza al nuevo porcentaje
// en vez de saltar directo.
export function Progreso({ paso, total }) {
  const ancho = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(ancho, { toValue: paso / total, duration: 350, useNativeDriver: false }).start();
  }, [ancho, paso, total]);

  return (
    <View style={estilos.progreso}>
      <Text style={estilos.progresoTexto}>Paso {paso} de {total}</Text>
      <View style={estilos.progresoPista}>
        <Animated.View style={[estilos.progresoRelleno, { width: ancho.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </View>
  );
}

export function Insignia({ texto, tono = 'exito' }) {
  const { fuerte, suave } = TONOS[tono];
  return (
    <View style={[estilos.insignia, { backgroundColor: suave }]}>
      <Text style={[estilos.insigniaTexto, { color: fuerte }]}>{texto}</Text>
    </View>
  );
}

export function Boton({ titulo, onPress, cargando = false, variante = 'primario', deshabilitado = false, icono }) {
  const fondo = variante === 'secundario' ? colores.blanco : colores.primario;
  const color = variante === 'secundario' ? colores.primario : colores.blanco;
  const escala = useRef(new Animated.Value(1)).current;
  const presionar = (hacia) => Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 50, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => presionar(0.96)}
      onPressOut={() => presionar(1)}
      disabled={cargando || deshabilitado}
      style={({ pressed }) => ({ opacity: pressed || deshabilitado ? 0.7 : 1 })}
    >
      <Animated.View
        style={[
          estilos.boton,
          { backgroundColor: fondo, transform: [{ scale: escala }] },
          variante === 'secundario' && estilos.botonSecundario,
        ]}
      >
        {cargando ? (
          <ActivityIndicator color={color} />
        ) : (
          <View style={estilos.botonContenido}>
            {icono && <Ionicons name={icono} size={22} color={color} />}
            <Text style={[estilos.botonTexto, { color }]}>{titulo}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo, padding: 24, justifyContent: 'center', gap: 16 },
  titulo: { fontSize: 26, fontWeight: '700', color: colores.texto },
  texto: { fontSize: 16, color: colores.texto, lineHeight: 22 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colores.borde, gap: 8 },
  halo: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  progreso: { gap: 6 },
  progresoTexto: { fontSize: 14, fontWeight: '600', color: colores.primario },
  progresoPista: { height: 6, borderRadius: 3, backgroundColor: colores.borde, overflow: 'hidden' },
  progresoRelleno: { height: 6, borderRadius: 3, backgroundColor: colores.primario },
  insignia: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  insigniaTexto: { fontSize: 13, fontWeight: '700' },
  boton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  botonSecundario: { borderWidth: 1.5, borderColor: colores.primario },
  botonContenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botonTexto: { fontSize: 17, fontWeight: '600' },
});
