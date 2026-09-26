// Paso 2 de 2 del registro: foto de referencia que DeepFace comparará en cada check-in.
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { subirFotoRegistro } from '../api/checador';
import { mensajeDeError } from '../api/client';
import { guardarSesion } from '../services/sesion';
import CamaraFrontal from '../components/CamaraFrontal';
import { Boton, IconoEstado, Pantalla, Texto, Titulo, colores } from '../components/ui';

export default function FotoRegistroScreen({ navigation, route }) {
  const { tokenVinculacion } = route.params;
  const [estado, setEstado] = useState('camara'); // camara | enviando | error
  const [error, setError] = useState(null);

  async function enviar(uri) {
    setEstado('enviando');
    try {
      await subirFotoRegistro(tokenVinculacion, uri);
      await guardarSesion({ fotoRegistrada: true });
      navigation.reset({ index: 0, routes: [{ name: 'Inicio' }] });
    } catch (e) {
      setError(mensajeDeError(e));
      setEstado('error');
    }
  }

  if (estado === 'camara') {
    return (
      <CamaraFrontal
        titulo="Registrar rostro"
        instruccion="Pon tu rostro dentro del óvalo, de frente, con buena luz y sin lentes oscuros ni gorra."
        textoBoton="Tomar foto de registro"
        onFoto={enviar}
      />
    );
  }

  return (
    <Pantalla>
      {estado === 'enviando' ? (
        <>
          <ActivityIndicator size="large" color={colores.primario} />
          <Titulo style={{ textAlign: 'center' }}>Guardando foto...</Titulo>
        </>
      ) : (
        <>
          <IconoEstado nombre="alert" tono="error" />
          <Titulo style={{ textAlign: 'center' }}>No se pudo guardar</Titulo>
          {error && <Texto style={{ color: colores.error, textAlign: 'center' }}>{error}</Texto>}
          <Boton titulo="Intentar de nuevo" onPress={() => setEstado('camara')} />
        </>
      )}
    </Pantalla>
  );
}
