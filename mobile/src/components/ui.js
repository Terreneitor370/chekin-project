import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export const colores = {
  fondo: '#F4F6F9',
  primario: '#1F3A5F',
  acento: '#2E75B6',
  exito: '#3C8D4F',
  error: '#B03A2E',
  texto: '#1B1F24',
  suave: '#5A6470',
  blanco: '#FFFFFF',
};

export function Pantalla({ children, style }) {
  return <View style={[estilos.pantalla, style]}>{children}</View>;
}

export function Titulo({ children }) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

export function Texto({ children, style }) {
  return <Text style={[estilos.texto, style]}>{children}</Text>;
}

export function Boton({ titulo, onPress, cargando = false, variante = 'primario', deshabilitado = false }) {
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
      {cargando ? <ActivityIndicator color={color} /> : <Text style={[estilos.botonTexto, { color }]}>{titulo}</Text>}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo, padding: 24, justifyContent: 'center', gap: 16 },
  titulo: { fontSize: 26, fontWeight: '700', color: colores.primario },
  texto: { fontSize: 16, color: colores.texto, lineHeight: 22 },
  boton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  botonSecundario: { borderWidth: 1.5, borderColor: colores.primario },
  botonTexto: { fontSize: 17, fontWeight: '600' },
});
