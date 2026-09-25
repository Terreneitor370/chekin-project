// Paso 3 del registro: foto de referencia que DeepFace comparará en cada check-in.
import { useState } from 'react';
import { subirFotoRegistro } from '../api/checador';
import { mensajeDeError } from '../api/client';
import { guardarSesion } from '../services/sesion';
import CamaraFrontal from '../components/CamaraFrontal';
import { Boton, Pantalla, Texto, Titulo, colores } from '../components/ui';

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
        instruccion="Mira de frente, con buena luz, sin lentes oscuros ni gorra. Esta foto se usará para verificarte."
        textoBoton="Tomar foto de registro"
        onFoto={enviar}
      />
    );
  }

  return (
    <Pantalla>
      <Titulo>{estado === 'enviando' ? 'Guardando foto...' : 'No se pudo guardar'}</Titulo>
      {error && <Texto style={{ color: colores.error }}>{error}</Texto>}
      {estado === 'error' && <Boton titulo="Intentar de nuevo" onPress={() => setEstado('camara')} />}
    </Pantalla>
  );
}
