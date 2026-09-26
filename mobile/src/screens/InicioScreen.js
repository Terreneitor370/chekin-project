// Decide a dónde ir según lo que el teléfono ya tiene registrado.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { leerSesion } from '../services/sesion';
import { Boton, Pantalla, Texto, Titulo } from '../components/ui';

export default function InicioScreen({ navigation }) {
  const [sesion, setSesion] = useState(undefined);

  useFocusEffect(
    useCallback(() => {
      leerSesion().then(setSesion);
    }, []),
  );

  if (sesion === undefined) return <Pantalla />;

  const listo = sesion?.huellaRegistrada && sesion?.fotoRegistrada;

  return (
    <Pantalla>
      <Titulo>Checador</Titulo>
      {listo ? (
        <>
          <Texto>Hola, {sesion.nombre}.</Texto>
          <Boton titulo="Checar" onPress={() => navigation.navigate('Checkin')} />
          <Boton titulo="Mi asistencia" variante="secundario" onPress={() => navigation.navigate('MiAsistencia')} />
        </>
      ) : (
        <>
          <Texto>Este teléfono aún no está registrado. Pide tu código de 6 dígitos al administrador.</Texto>
          <Boton titulo="Registrar este teléfono" onPress={() => navigation.navigate('Vincular')} />
        </>
      )}
      <Boton titulo="Pruebas del Día 1" variante="secundario" onPress={() => navigation.navigate('Pruebas')} />
    </Pantalla>
  );
}
