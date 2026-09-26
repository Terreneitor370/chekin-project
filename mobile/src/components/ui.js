import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export const colores = {
  fondo: '#F4F6FB',
  primario: '#2563EB',
  primarioSuave: '#E8EEFD',
  acento: '#2563EB',
  exito: '#0F7B4A',
  exitoSuave: '#DDF5E8',
  error: '#C62828',
  errorSuave: '#FDE7E7',
  texto: '#1B1F24',
  suave: '#5A6470',
  borde: '#DCE3F0',
  blanco: '#FFFFFF',
};

const TONOS = {
  primario: { fuerte: colores.primario, suave: colores.primarioSuave },
  exito: { fuerte: colores.exito, suave: colores.exitoSuave },
  error: { fuerte: colores.error, suave: colores.errorSuave },
};

export function Pantalla({ children, style }) {
  return <View style={[estilos.pantalla, style]}>{children}</View>;
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
export function IconoEstado({ nombre, tono = 'primario', tamano = 120 }) {
  const { fuerte, suave } = TONOS[tono];
  const interior = tamano * 0.62;
  return (
    <View style={[estilos.halo, { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: suave }]}>
      <View style={{ width: interior, height: interior, borderRadius: interior / 2, backgroundColor: fuerte, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={nombre} size={interior * 0.55} color={colores.blanco} />
      </View>
    </View>
  );
}

// Barra "Paso 1 de 2" del registro.
export function Progreso({ paso, total }) {
  return (
    <View style={estilos.progreso}>
      <Text style={estilos.progresoTexto}>Paso {paso} de {total}</Text>
      <View style={estilos.progresoPista}>
        <View style={[estilos.progresoRelleno, { width: `${(paso / total) * 100}%` }]} />
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
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando || deshabilitado}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: fondo, opacity: pressed || deshabilitado ? 0.7 : 1 },
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
