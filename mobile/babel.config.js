module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4 delega los worklets a este paquete; el plugin
    // siempre debe ir al final de la lista.
    plugins: ['react-native-worklets/plugin'],
  };
};
