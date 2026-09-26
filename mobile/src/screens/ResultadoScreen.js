// Confirmación: "Check-in registrado a las 09:15" (PDF: ConfirmacionScreen)
import { Boton, IconoEstado, Insignia, Pantalla, Tarjeta, Texto, Titulo, colores } from '../components/ui';

const TZ = 'America/Hermosillo';
const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });

export default function ResultadoScreen({ navigation, route }) {
  const { checkin, empleado, tokenEmpleado } = route.params.respuesta;
  const esEntrada = checkin.tipo === 'entrada';
  return (
    <Pantalla>
      <IconoEstado nombre="checkmark" tono="exito" />
      <Titulo style={{ textAlign: 'center' }}>¡Asistencia registrada!</Titulo>

      <Tarjeta>
        <Texto style={{ fontSize: 20, fontWeight: '700' }}>{empleado.nombre}</Texto>
        <Insignia texto={esEntrada ? 'ENTRADA' : 'SALIDA'} tono={checkin.tarde ? 'error' : 'exito'} />
        <Texto style={{ fontSize: 38, fontWeight: '700', color: checkin.tarde ? colores.error : colores.exito }}>
          {hora(checkin.registradoEn)}
        </Texto>
        <Texto style={{ color: colores.suave, textTransform: 'capitalize' }}>{fecha(checkin.registradoEn)}</Texto>
        {checkin.tarde && <Texto style={{ color: colores.error }}>Registrado con retardo.</Texto>}
      </Tarjeta>

      {tokenEmpleado && (
        <Boton titulo="Ver mi asistencia" variante="secundario" icono="calendar-outline" onPress={() => navigation.replace('MiAsistencia', { tokenEmpleado })} />
      )}
      <Boton titulo="Listo" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Inicio' }] })} />
    </Pantalla>
  );
}
