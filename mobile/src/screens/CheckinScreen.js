// Check-in: reto -> huella firma -> selfie -> servidor verifica firma + rostro (DeepFace).
import { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { enviarCheckin, pedirReto } from '../api/checador';
import { codigoDeError, mensajeDeError } from '../api/client';
import { firmar } from '../services/biometria';
import { leerSesion } from '../services/sesion';
import CamaraFrontal from '../components/CamaraFrontal';
import { Boton, IconoEstado, Pantalla, Tarjeta, Texto, Titulo, colores } from '../components/ui';

// Errores de rostro: se muestran los consejos para volver a intentar
const CODIGOS_CON_CONSEJOS = ['ROSTRO_NO_COINCIDE', 'SIN_ROSTRO'];
const CONSEJOS = [
  ['glasses-outline', 'Retira lentes oscuros, cubrebocas o gorras.'],
  ['sunny-outline', 'Busca un lugar con buena luz de frente, sin contraluces.'],
  ['scan-outline', 'Mira directo a la cámara, a la altura de tus ojos.'],
];

export default function CheckinScreen({ navigation }) {
  const [paso, setPaso] = useState('inicio'); // inicio | camara | enviando | error | sinRespuesta
  const [error, setError] = useState(null);
  const [codigo, setCodigo] = useState(null);
  const datos = useRef({});

  async function empezar() {
    setError(null);
    setCodigo(null);
    try {
      const sesion = await leerSesion();
      const { retoId, reto } = await pedirReto(sesion.empleadoId);
      const firma = await firmar(reto);
      // Un idempotencyKey por intento: si la red reintenta, el servidor no duplica el registro
      datos.current = { empleadoId: sesion.empleadoId, retoId, firma, idempotencyKey: Crypto.randomUUID() };
      setPaso('camara');
    } catch (e) {
      setError(mensajeDeError(e));
      setCodigo(codigoDeError(e));
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
      setCodigo(codigoDeError(e));
      setPaso(e?.response ? 'error' : 'sinRespuesta');
    }
  }

  if (paso === 'camara') {
    return (
      <CamaraFrontal
        titulo="Ahora tu selfie"
        instruccion="Mira de frente a la cámara y mantén una expresión neutra."
        textoBoton="Checar"
        onFoto={enviar}
      />
    );
  }

  if (paso === 'enviando') {
    return (
      <Pantalla style={{ alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Titulo>Verificando...</Titulo>
        <Texto style={{ textAlign: 'center', color: colores.suave }}>
          Estamos verificando tu huella y tu rostro. Puede tardar unos segundos.
        </Texto>
      </Pantalla>
    );
  }

  if (paso === 'inicio') {
    return (
      <Pantalla>
        <IconoEstado nombre="finger-print" tamano={180} />
        <Titulo style={{ textAlign: 'center' }}>Registrar asistencia</Titulo>
        <Texto style={{ textAlign: 'center', color: colores.suave }}>
          Confirma con tu huella y después tómate una selfie.
        </Texto>
        <Boton titulo="Empezar" icono="finger-print" onPress={empezar} />
      </Pantalla>
    );
  }

  const sinRespuesta = paso === 'sinRespuesta';
  const titulo = sinRespuesta ? 'Sin conexión' : codigo === 'ROSTRO_NO_COINCIDE' ? 'No pudimos verificar tu rostro' : 'No se pudo registrar';
  return (
    <Pantalla>
      <IconoEstado nombre={sinRespuesta ? 'cloud-offline-outline' : 'close'} tono="error" />
      <Titulo style={{ textAlign: 'center' }}>{titulo}</Titulo>
      <Texto style={{ textAlign: 'center', color: colores.suave }}>{error}</Texto>
      {CODIGOS_CON_CONSEJOS.includes(codigo) && (
        <Tarjeta>
          <Texto style={{ fontWeight: '700', color: colores.primario }}>Consejos para un buen escaneo</Texto>
          {CONSEJOS.map(([icono, texto]) => (
            <View key={icono} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={icono} size={22} color={colores.suave} />
              <Texto style={{ flex: 1 }}>{texto}</Texto>
            </View>
          ))}
        </Tarjeta>
      )}
      {sinRespuesta && <Boton titulo="Reenviar" onPress={() => enviar(datos.current.selfieUri)} />}
      <Boton titulo="Intentar de nuevo" variante={sinRespuesta ? 'secundario' : 'primario'} onPress={empezar} />
    </Pantalla>
  );
}
