import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InicioScreen from '../screens/InicioScreen';
import VincularScreen from '../screens/VincularScreen';
import RegistroHuellaScreen from '../screens/RegistroHuellaScreen';
import FotoRegistroScreen from '../screens/FotoRegistroScreen';
import CheckinScreen from '../screens/CheckinScreen';
import ResultadoScreen from '../screens/ResultadoScreen';
import PruebasScreen from '../screens/PruebasScreen';
import MiAsistenciaScreen from '../screens/MiAsistenciaScreen';

import { colores } from '../components/ui';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio" screenOptions={{ headerTintColor: colores.primario, contentStyle: { backgroundColor: colores.fondo } }}>
        <Stack.Screen name="Inicio" component={InicioScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Vincular" component={VincularScreen} options={{ title: 'Vincular dispositivo' }} />
        <Stack.Screen name="RegistroHuella" component={RegistroHuellaScreen} options={{ title: 'Registrar huella' }} />
        <Stack.Screen name="FotoRegistro" component={FotoRegistroScreen} options={{ title: 'Registrar rostro' }} />
        <Stack.Screen name="Checkin" component={CheckinScreen} options={{ title: 'Checar' }} />
        <Stack.Screen name="Resultado" component={ResultadoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MiAsistencia" component={MiAsistenciaScreen} options={{ title: 'Mi asistencia' }} />
        <Stack.Screen name="Pruebas" component={PruebasScreen} options={{ title: 'Pruebas del Día 1' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
