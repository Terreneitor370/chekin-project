import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InicioScreen from '../screens/InicioScreen';
import VincularScreen from '../screens/VincularScreen';
import RegistroHuellaScreen from '../screens/RegistroHuellaScreen';
import FotoRegistroScreen from '../screens/FotoRegistroScreen';
import CheckinScreen from '../screens/CheckinScreen';
import ResultadoScreen from '../screens/ResultadoScreen';
import PruebasScreen from '../screens/PruebasScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio">
        <Stack.Screen name="Inicio" component={InicioScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Vincular" component={VincularScreen} options={{ title: 'Registro 1 de 3' }} />
        <Stack.Screen name="RegistroHuella" component={RegistroHuellaScreen} options={{ title: 'Registro 2 de 3' }} />
        <Stack.Screen name="FotoRegistro" component={FotoRegistroScreen} options={{ title: 'Registro 3 de 3' }} />
        <Stack.Screen name="Checkin" component={CheckinScreen} options={{ title: 'Checar' }} />
        <Stack.Screen name="Resultado" component={ResultadoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Pruebas" component={PruebasScreen} options={{ title: 'Pruebas del Día 1' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
