// Paso 1 del registro: código de vinculación (reemplaza la LoginScreen con ID del PDF).
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { vincular } from '../api/checador';
import { mensajeDeError } from '../api/client';
import { guardarSesion } from '../services/sesion';
import { Boton, IconoEstado, Pantalla, Tarjeta, Texto, Titulo, colores } from '../components/ui';

const LARGO = 6;

export default function VincularScreen({ navigation }) {
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const input = useRef(null);

  async function continuar() {
    setError(null);
    setCargando(true);
    try {
      const { tokenVinculacion, empleado } = await vincular(codigo);
      await guardarSesion({ empleadoId: empleado.id, nombre: empleado.nombre, huellaRegistrada: false, fotoRegistrada: false });
      navigation.replace('RegistroHuella', { tokenVinculacion, nombre: empleado.nombre });
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }

  return (
    <Pantalla>
      <Tarjeta style={{ alignItems: 'center', gap: 16, padding: 24 }}>
        <IconoEstado nombre="lock-open-outline" tamano={96} />
        <Titulo>Vincular dispositivo</Titulo>
        <Texto style={{ textAlign: 'center', color: colores.suave }}>
          Ingresa el código de 6 dígitos que te dio el administrador.
        </Texto>

        {/* Un solo TextInput invisible encima de las casillas: el teclado numérico del sistema escribe en ellas */}
        <Pressable onPress={() => input.current?.focus()} style={estilos.casillas}>
          {Array.from({ length: LARGO }, (_, i) => (
            <View key={i} style={[estilos.casilla, i === codigo.length && estilos.casillaActiva]}>
              <Texto style={estilos.digito}>{codigo[i] ?? ''}</Texto>
            </View>
          ))}
          <TextInput
            ref={input}
            value={codigo}
            onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, LARGO))}
            keyboardType="number-pad"
            maxLength={LARGO}
            autoFocus
            caretHidden
            style={estilos.inputOculto}
          />
        </Pressable>

        {error && <Texto style={{ color: colores.error, textAlign: 'center' }}>{error}</Texto>}
      </Tarjeta>
      <Boton titulo="Continuar" onPress={continuar} cargando={cargando} deshabilitado={codigo.length !== LARGO} />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  casillas: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  casilla: {
    width: 44, height: 56, borderRadius: 12, backgroundColor: colores.primarioSuave,
    borderWidth: 1.5, borderColor: colores.borde, alignItems: 'center', justifyContent: 'center',
  },
  casillaActiva: { borderColor: colores.primario, backgroundColor: colores.blanco },
  digito: { fontSize: 24, fontWeight: '700' },
  inputOculto: { ...StyleSheet.absoluteFillObject, opacity: 0.02 },
});
