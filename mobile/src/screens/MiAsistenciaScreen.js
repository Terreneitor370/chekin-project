// Dashboard del empleado (rol "empleado"): su registro de hoy, totales y últimos 7 días.
// Si viene de un check-in usa el tokenEmpleado de la respuesta; si no, pide la huella para abrir sesión.
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { abrirSesionEmpleado, miAsistencia, pedirReto } from '../api/checador';
import { mensajeDeError } from '../api/client';
import { firmar } from '../services/biometria';
import { leerSesion } from '../services/sesion';
import { Boton, IconoEstado, Insignia, Pantalla, Tarjeta, Texto, Titulo, colores } from '../components/ui';

const TZ = 'America/Hermosillo';
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: TZ }) : '--:--');
const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });

export default function MiAsistenciaScreen({ route }) {
  const [token, setToken] = useState(route.params?.tokenEmpleado ?? null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async (t) => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await miAsistencia(t));
    } catch (e) {
      setError(mensajeDeError(e));
      if (e?.response?.status === 401) setToken(null); // token vencido: pedir huella otra vez
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (token) cargar(token);
  }, [token, cargar]);

  async function entrarConHuella() {
    setCargando(true);
    setError(null);
    try {
      const sesion = await leerSesion();
      const { retoId, reto } = await pedirReto(sesion.empleadoId);
      const firma = await firmar(reto, 'Confirma tu huella para ver tu asistencia');
      const { tokenEmpleado } = await abrirSesionEmpleado({ empleadoId: sesion.empleadoId, retoId, firma });
      setToken(tokenEmpleado);
    } catch (e) {
      setError(mensajeDeError(e));
      setCargando(false);
    }
  }

  if (!token) {
    return (
      <Pantalla>
        <IconoEstado nombre="finger-print" tamano={150} />
        <Titulo style={{ textAlign: 'center' }}>Mi asistencia</Titulo>
        <Texto style={{ textAlign: 'center', color: colores.suave }}>Confirma tu huella para ver tus registros.</Texto>
        {error && <Texto style={{ color: colores.error, textAlign: 'center' }}>{error}</Texto>}
        <Boton titulo="Usar huella" icono="finger-print" onPress={entrarConHuella} cargando={cargando} />
      </Pantalla>
    );
  }

  if (!datos) {
    return (
      <Pantalla>
        <Texto style={{ textAlign: 'center' }}>{cargando ? 'Cargando...' : error}</Texto>
        {error && <Boton titulo="Reintentar" onPress={() => cargar(token)} />}
      </Pantalla>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Titulo>{datos.empleado.nombre}</Titulo>
      <Texto style={{ color: colores.suave }}>Horario de entrada {datos.empleado.horaEntrada} (tolerancia {datos.empleado.toleranciaMin} min)</Texto>

      <View style={estilos.tarjetas}>
        <Tarjeta style={estilos.tarjeta}>
          <Texto style={estilos.etiqueta}>Hoy</Texto>
          <Texto style={[estilos.valor, datos.hoy?.tarde && { color: colores.error }]}>
            {hora(datos.hoy?.entrada)} - {hora(datos.hoy?.salida)}
          </Texto>
        </Tarjeta>
        <Tarjeta style={estilos.tarjeta}>
          <Texto style={estilos.etiqueta}>Días</Texto>
          <Texto style={estilos.valor}>{datos.totales.diasConAsistencia}</Texto>
        </Tarjeta>
        <Tarjeta style={estilos.tarjeta}>
          <Texto style={estilos.etiqueta}>Retardos</Texto>
          <Texto style={estilos.valor}>{datos.totales.tardanzas}</Texto>
        </Tarjeta>
      </View>

      <FlatList
        data={datos.registros}
        keyExtractor={(r) => String(r.id)}
        refreshing={cargando}
        onRefresh={() => cargar(token)}
        ListEmptyComponent={<Texto>Sin registros en los últimos 7 días.</Texto>}
        renderItem={({ item }) => (
          <Tarjeta style={estilos.fila}>
            <Texto style={{ flex: 1, textTransform: 'capitalize' }}>{fecha(item.registradoEn)}</Texto>
            <Texto>{item.tipo === 'entrada' ? 'Entrada' : 'Salida'} {hora(item.registradoEn)}</Texto>
            <Insignia texto={item.tarde ? 'Retardo' : 'A tiempo'} tono={item.tarde ? 'advertencia' : 'exito'} />
          </Tarjeta>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo, padding: 20, gap: 12 },
  tarjetas: { flexDirection: 'row', gap: 10 },
  tarjeta: { flex: 1, padding: 12, gap: 2 },
  etiqueta: { fontSize: 13, color: colores.suave },
  valor: { fontSize: 18, fontWeight: '700' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 8 },
});
