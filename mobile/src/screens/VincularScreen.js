// Paso 1 del registro: código de vinculación (reemplaza la LoginScreen con ID del PDF).
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { vincular } from '../api/checador';
import { mensajeDeError } from '../api/client';
import { guardarSesion } from '../services/sesion';
import { Boton, Pantalla, Texto, Titulo, colores } from '../components/ui';

export default function VincularScreen({ navigation }) {
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

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
      <Titulo>Registrar teléfono</Titulo>
      <Texto>Escribe el código de 6 dígitos que te dio el administrador.</Texto>
      <TextInput
        value={codigo}
        onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        placeholder="000000"
        style={estilos.input}
        maxLength={6}
      />
      {error && <Texto style={{ color: colores.error }}>{error}</Texto>}
      <Boton titulo="Continuar" onPress={continuar} cargando={cargando} deshabilitado={codigo.length !== 6} />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  input: {
    backgroundColor: colores.blanco, borderRadius: 12, padding: 16, fontSize: 28,
    letterSpacing: 8, textAlign: 'center', borderWidth: 1, borderColor: '#D0D7E0',
  },
});
