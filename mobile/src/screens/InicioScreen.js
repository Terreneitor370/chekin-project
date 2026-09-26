// Decide a dónde ir según lo que el teléfono ya tiene registrado.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { leerSesion } from '../services/sesion';
import { Boton, IconoEstado, Pantalla, Tarjeta, Texto, Titulo, colores } from '../components/ui';

const TZ = 'America/Hermosillo';

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

export default function InicioScreen({ navigation }) {
  const [sesion, setSesion] = useState(undefined);
  const ahora = useReloj();

  useFocusEffect(
    useCallback(() => {
      leerSesion().then(setSesion);
    }, []),
  );

  if (sesion === undefined) return <Pantalla />;

  const listo = sesion?.huellaRegistrada && sesion?.fotoRegistrada;
  const fecha = ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
  const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: TZ });

  return (
    <Pantalla>
      <View style={estilos.encabezado}>
        <Ionicons name="finger-print" size={30} color={colores.primario} />
        <Titulo style={{ color: colores.primario, fontSize: 22 }}>Checador Inteligente</Titulo>
      </View>

      {listo ? (
        <>
          <Tarjeta style={estilos.reloj}>
            <Texto style={estilos.saludo}>Hola, {sesion.nombre}</Texto>
            <Texto style={estilos.hora}>{hora}</Texto>
            <Texto style={{ color: colores.suave, textTransform: 'capitalize' }}>{fecha}</Texto>
          </Tarjeta>

          <Pressable onPress={() => navigation.navigate('Checkin')} style={({ pressed }) => [estilos.checar, pressed && { opacity: 0.85 }]}>
            <Ionicons name="finger-print" size={40} color={colores.blanco} />
            <View style={{ flex: 1 }}>
              <Texto style={estilos.checarTitulo}>CHECAR ASISTENCIA</Texto>
              <Texto style={estilos.checarSub}>Huella + rostro</Texto>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colores.blanco} />
          </Pressable>

          <Boton titulo="Mi asistencia" variante="secundario" icono="calendar-outline" onPress={() => navigation.navigate('MiAsistencia')} />
        </>
      ) : (
        <Tarjeta style={{ alignItems: 'center', gap: 16, padding: 24 }}>
          <IconoEstado nombre="link" />
          <Titulo>Vincular dispositivo</Titulo>
          <Texto style={{ textAlign: 'center', color: colores.suave }}>
            Este teléfono aún no está registrado. Pide tu código de 6 dígitos al administrador.
          </Texto>
          <View style={{ alignSelf: 'stretch' }}>
            <Boton titulo="Registrar este teléfono" onPress={() => navigation.navigate('Vincular')} />
          </View>
        </Tarjeta>
      )}

      <Pressable onPress={() => navigation.navigate('Pruebas')} style={{ alignSelf: 'center', padding: 8 }}>
        <Texto style={{ color: colores.suave, fontSize: 13 }}>Pruebas del Día 1</Texto>
      </Pressable>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  reloj: { alignItems: 'center', paddingVertical: 24 },
  saludo: { fontSize: 15, color: colores.suave },
  hora: { fontSize: 44, fontWeight: '700', fontVariant: ['tabular-nums'], color: colores.texto },
  checar: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colores.primario, borderRadius: 18, padding: 20 },
  checarTitulo: { color: colores.blanco, fontSize: 19, fontWeight: '800' },
  checarSub: { color: '#DCE6FF', fontSize: 14 },
});
