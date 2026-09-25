// Paso 2 del registro: crea la llave protegida por la huella y la envía a la BD.
import { useState } from 'react';
import { Platform } from 'react-native';
import { registrarLlave } from '../api/checador';
import { mensajeDeError } from '../api/client';
import { crearLlaves, firmar, sensorDisponible } from '../services/biometria';
import { guardarSesion } from '../services/sesion';
import { Boton, Pantalla, Texto, Titulo, colores } from '../components/ui';

export default function RegistroHuellaScreen({ navigation, route }) {
  const { tokenVinculacion, nombre } = route.params;
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function registrar() {
    setError(null);
    setCargando(true);
    try {
      const sensor = await sensorDisponible();
      if (!sensor.disponible) throw new Error('Este teléfono no tiene huella configurada. Regístrala en Ajustes.');
      const llavePublica = await crearLlaves();
      await firmar('registro', 'Pon tu huella para registrarla'); // confirma que la huella desbloquea la llave
      await registrarLlave(tokenVinculacion, llavePublica, `${Platform.OS} ${Platform.Version}`);
      await guardarSesion({ huellaRegistrada: true });
      navigation.replace('FotoRegistro', { tokenVinculacion });
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }

  return (
    <Pantalla>
      <Titulo>Hola, {nombre}</Titulo>
      <Texto>Ahora registra tu huella. Tu huella nunca sale del teléfono: solo se guarda una llave digital protegida por ella.</Texto>
      {error && <Texto style={{ color: colores.error }}>{error}</Texto>}
      <Boton titulo="Registrar huella" onPress={registrar} cargando={cargando} />
    </Pantalla>
  );
}
