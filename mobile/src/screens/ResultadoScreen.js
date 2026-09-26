// Confirmación: "Check-in registrado a las 09:15" (PDF: ConfirmacionScreen)
import { Boton, Pantalla, Texto, Titulo, colores } from '../components/ui';

function hora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Hermosillo' });
}

export default function ResultadoScreen({ navigation, route }) {
  const { checkin, empleado, tokenEmpleado } = route.params.respuesta;
  return (
    <Pantalla>
      <Titulo>Registro exitoso</Titulo>
      <Texto>{empleado.nombre}</Texto>
      <Texto style={{ fontSize: 22, fontWeight: '700', color: colores.exito }}>
        {checkin.tipo === 'entrada' ? 'Entrada' : 'Salida'} a las {hora(checkin.registradoEn)}
      </Texto>
      {checkin.tarde && <Texto style={{ color: colores.error }}>Registrado con retardo.</Texto>}
      {tokenEmpleado && (
        <Boton titulo="Ver mi asistencia" variante="secundario" onPress={() => navigation.replace('MiAsistencia', { tokenEmpleado })} />
      )}
      <Boton titulo="Listo" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Inicio' }] })} />
    </Pantalla>
  );
}
