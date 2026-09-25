// Check-in: reto -> huella firma -> selfie -> servidor verifica firma + rostro (DeepFace).
import { useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { enviarCheckin, pedirReto } from '../api/checador';
import { mensajeDeError } from '../api/client';
import { firmar } from '../services/biometria';
import { leerSesion } from '../services/sesion';
import CamaraFrontal from '../components/CamaraFrontal';
import { Boton, Pantalla, Texto, Titulo, colores } from '../components/ui';

export default function CheckinScreen({ navigation }) {
  const [paso, setPaso] = useState('inicio'); // inicio | camara | enviando | error
  const [error, setError] = useState(null);
  const datos = useRef({});

  async function empezar() {
    setError(null);
    try {
      const sesion = await leerSesion();
      const { retoId, reto } = await pedirReto(sesion.empleadoId);
      const firma = await firmar(reto);
      // Un idempotencyKey por intento: si la red reintenta, el servidor no duplica el registro
      datos.current = { empleadoId: sesion.empleadoId, retoId, firma, idempotencyKey: Crypto.randomUUID() };
      setPaso('camara');
    } catch (e) {
      setError(mensajeDeError(e));
      setPaso('error');
    }
  }

  async function enviar(selfieUri) {
    setPaso('enviando');
    try {
      const respuesta = await enviarCheckin({ ...datos.current, selfieUri });
      navigation.replace('Resultado', { respuesta });
    } catch (e) {
      setError(mensajeDeError(e));
      setPaso('error');
    }
  }

  if (paso === 'camara') {
    return <CamaraFrontal instruccion="Ahora tu selfie: mira de frente a la cámara." textoBoton="Checar" onFoto={enviar} />;
  }

  return (
    <Pantalla>
      <Titulo>{paso === 'enviando' ? 'Verificando...' : 'Registrar asistencia'}</Titulo>
      {paso === 'inicio' && <Texto>Pon tu huella y después tómate una selfie.</Texto>}
      {paso === 'enviando' && <Texto>Estamos verificando tu huella y tu rostro. Puede tardar unos segundos.</Texto>}
      {error && <Texto style={{ color: colores.error }}>{error}</Texto>}
      {(paso === 'inicio' || paso === 'error') && (
        <Boton titulo={paso === 'error' ? 'Intentar de nuevo' : 'Empezar'} onPress={empezar} />
      )}
    </Pantalla>
  );
}
