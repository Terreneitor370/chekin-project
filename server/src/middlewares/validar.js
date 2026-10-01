import { errores } from '../utils/errores.js';

// Valida req.body, req.query o req.params con un esquema de zod y deja los valores
// ya convertidos (números, booleanos) donde la ruta los espera.
// Todo fallo responde 400 DATOS_INVALIDOS con el campo que falló (docs/api.md).
//
//   router.post('/', validar(esquema), controlador)
export function validar(esquema, parte = 'body') {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req[parte] ?? {});
    if (!resultado.success) return next(errores.datosInvalidos(mensajeDe(resultado.error)));
    // En Express 5 req.query es un getter del prototipo: se define en la instancia
    // para poder sobrescribirlo con los datos ya parseados.
    Object.defineProperty(req, parte, {
      value: resultado.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}

// "empleadoId: Falta empleadoId" -> solo el primer problema, que es el que importa al usuario
function mensajeDe(error) {
  const [problema] = error.issues;
  const campo = problema.path.join('.');
  return campo ? `${campo}: ${problema.message}` : problema.message;
}
