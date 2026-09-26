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
  const [paso, setPaso] = useState('inicio'); // inicio | camara | enviando | error | sinRespuesta
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

  // Reglas de reintento (docs/api.md, sección 4):
  //  - Sin respuesta del servidor (red caída): reenviar la MISMA petición con el mismo idempotencyKey.
  //  - Cualquier respuesta de error (503, rostro, etc.): el reto ya se gastó -> "Intentar de nuevo" pide reto y huella nuevos.
  async function enviar(selfieUri) {
    datos.current.selfieUri = selfieUri;
    setPaso('enviando');
    try {
      const respuesta = await enviarCheckin(datos.current);
      navigation.replace('Resultado', { respuesta });
    } catch (e) {
      setError(mensajeDeError(e));
      setPaso(e?.response ? 'error' : 'sinRespuesta');
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
      {paso === 'sinRespuesta' && (
        <Boton titulo="Reenviar" onPress={() => enviar(datos.current.selfieUri)} />
      )}
      {(paso === 'inicio' || paso === 'error' || paso === 'sinRespuesta') && (
        <Boton
          titulo={paso === 'inicio' ? 'Empezar' : 'Intentar de nuevo'}
          variante={paso === 'sinRespuesta' ? 'secundario' : 'primario'}
          onPress={empezar}
        />
      )}
    </Pantalla>
  );
}
