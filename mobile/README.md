# /mobile

**Dueña:** Isabel Celis (Dev 1)

App React Native (Expo) del checador: registro del teléfono (código + huella + foto) y check-in (huella + selfie).

## Antes de empezar

- `react-native-biometrics` necesita **development build**. En Expo Go no funciona.
- En Android, el desbloqueo facial suele ser biometría "débil" y no sirve para firmar. La firma se hace con la **huella**; el rostro lo verifica DeepFace en el servidor.
- `react-native-biometrics` es una librería antigua (2022). Probar el Día 1 que compile con esta versión de Expo; si falla, avisar al equipo ese mismo día.

## Requisitos

- Node.js 20+, Android Studio (SDK de Android) y JDK 17
- Teléfono Android con huella registrada, **Depuración USB** activa (en ColorOS también "Instalar vía USB")

## Correr en el teléfono

```bash
cp .env.example .env          # poner la IP de la laptop o la URL del VPS
npm install
npx expo run:android          # compila el development build y lo instala en el teléfono conectado por USB
npm start                     # siguientes veces: solo levanta Metro
```

## Estructura

```
App.js
src/
  config.js                   URL del API, tamaño y calidad de fotos
  api/client.js               axios + mensajes de error del contrato
  api/checador.js             endpoints de docs/api.md
  services/biometria.js       react-native-biometrics: crear llaves y firmar
  services/sesion.js          datos del usuario en SecureStore
  services/imagen.js          compresión a 1024 px, JPEG 70%
  components/ui.js            botones, textos, colores
  components/CamaraFrontal.js cámara con guía ovalada
  navigation/AppNavigator.js
  screens/
    InicioScreen.js           decide: registrar o checar
    VincularScreen.js         1/3 código de 6 dígitos (reemplaza LoginScreen con ID)
    RegistroHuellaScreen.js   2/3 llave protegida por la huella -> BD
    FotoRegistroScreen.js     3/3 foto de referencia para DeepFace
    CheckinScreen.js          reto -> huella firma -> selfie -> envío
    ResultadoScreen.js        "Entrada a las 09:15"
    MiAsistenciaScreen.js     dashboard del empleado (hoy, días, retardos, últimos 7 días)
    PruebasScreen.js          pruebas del Día 1
```

## Pruebas del Día 1 (pantalla "Pruebas del Día 1")

1. Sensor de huella disponible
2. `createKeys()` devuelve la llave pública
3. `createSignature()` pide la huella y devuelve la firma
4. Cámara frontal toma y comprime la foto
5. `/health` del backend responde
6. "Compartir" la llave y la firma con Kassandra para `npm run probar-firma` en `/server`

## Pendientes (Isabel)

- [ ] Confirmar compilación de react-native-biometrics en el Oppo Reno 14
- [ ] Mensajes específicos por código de error (DUPLICADO, ROSTRO_NO_COINCIDE, etc.)
- [ ] Probar en 2 o 3 teléfonos
- [ ] Probar "Mi asistencia" cuando Kassandra publique /api/mi/sesion y /api/mi/asistencia
