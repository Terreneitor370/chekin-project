// Pruebas del Día 1 en el teléfono real (Oppo Reno 14 de Isabel):
// 1) sensor  2) createKeys  3) createSignature  4) cámara  5) conexión con el backend
// "Compartir" envía la llave, el texto y la firma para que Kassandra los valide con: npm run probar-firma
import { useState } from 'react';
import { Image, ScrollView, Share, StyleSheet, Text } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { crearLlaves, firmar, sensorDisponible } from '../services/biometria';
import CamaraFrontal from '../components/CamaraFrontal';
import { Boton, Texto, Titulo, colores } from '../components/ui';

const TEXTO_PRUEBA = 'prueba-dia-1';

export default function PruebasScreen() {
  const [log, setLog] = useState([]);
  const [llave, setLlave] = useState(null);
  const [firma, setFirma] = useState(null);
  const [foto, setFoto] = useState(null);
  const [camara, setCamara] = useState(false);

  const anotar = (texto) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${texto}`, ...l]);

  async function probar(nombre, fn) {
    try {
      anotar(`${nombre}: ${await fn()}`);
    } catch (e) {
      anotar(`${nombre}: ERROR ${e.message}`);
    }
  }

  if (camara) {
    return (
      <CamaraFrontal
        instruccion="Prueba de cámara frontal"
        onFoto={(uri) => {
          setFoto(uri);
          setCamara(false);
          anotar('4. Cámara: foto tomada y comprimida');
        }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Titulo>Pruebas del Día 1</Titulo>
      <Texto style={{ color: colores.suave }}>API: {API_URL}</Texto>

      <Boton titulo="1. ¿Hay sensor de huella?" onPress={() => probar('1. Sensor', async () => JSON.stringify(await sensorDisponible()))} />
      <Boton
        titulo="2. Crear llaves (createKeys)"
        onPress={() => probar('2. createKeys', async () => {
          const k = await crearLlaves();
          setLlave(k);
          return `llave pública de ${k.replace(/\s/g, '').length} caracteres`;
        })}
      />
      <Boton
        titulo="3. Firmar con huella (createSignature)"
        onPress={() => probar('3. createSignature', async () => {
          const f = await firmar(TEXTO_PRUEBA, 'Prueba de firma');
          setFirma(f);
          return `firma de ${f.replace(/\s/g, '').length} caracteres`;
        })}
      />
      <Boton titulo="4. Probar cámara frontal" onPress={() => setCamara(true)} />
      <Boton
        titulo="5. Conexión con el backend (/health)"
        onPress={() => probar('5. Backend', async () => JSON.stringify((await axios.get(`${API_URL}/health`, { timeout: 8000 })).data))}
      />
      <Boton
        titulo="Compartir llave y firma con Kassandra"
        variante="secundario"
        deshabilitado={!llave || !firma}
        onPress={() => Share.share({ message: `llavePublica:\n${llave}\n\ntexto: ${TEXTO_PRUEBA}\n\nfirma:\n${firma}` })}
      />

      {foto && <Image source={{ uri: foto }} style={estilos.foto} />}
      {log.map((linea, i) => (
        <Text key={i} style={estilos.log} selectable>{linea}</Text>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, gap: 12, backgroundColor: colores.fondo },
  foto: { width: 160, height: 200, borderRadius: 12, alignSelf: 'center' },
  log: { fontFamily: 'monospace', fontSize: 12, color: colores.texto },
});
