// Error de aplicación con el formato del contrato: { error: { codigo, mensaje } }
export class AppError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

export const errores = {
  datosInvalidos: (m = 'Datos inválidos') => new AppError(400, 'DATOS_INVALIDOS', m),
  imagenInvalida: () => new AppError(400, 'IMAGEN_INVALIDA', 'El archivo no es una imagen válida'),
  noAutenticado: (m = 'Sesión no válida o expirada') => new AppError(401, 'NO_AUTENTICADO', m),
  firmaInvalida: () => new AppError(401, 'FIRMA_INVALIDA', 'No pudimos validar tu huella'),
  retoInvalido: () => new AppError(401, 'RETO_INVALIDO', 'La solicitud expiró, intenta de nuevo'),
  sinPermiso: () => new AppError(403, 'SIN_PERMISO', 'No tienes permiso para esta acción'),
  rostroNoCoincide: () => new AppError(403, 'ROSTRO_NO_COINCIDE', 'No pudimos verificar tu rostro'),
  rostroNoReal: () => new AppError(403, 'ROSTRO_NO_REAL', 'La imagen no parece de una persona real'),
  noEncontrado: (m = 'No encontrado') => new AppError(404, 'NO_ENCONTRADO', m),
  duplicado: (hora) => new AppError(409, 'DUPLICADO', `Ya registraste asistencia a las ${hora}`),
  yaRegistrado: (tipo) => new AppError(409, 'YA_REGISTRADO', tipo === 'entrada' ? 'Ya registraste tu entrada hoy' : 'Ya registraste tu salida hoy'),
  sinEntrada: () => new AppError(409, 'SIN_ENTRADA', 'Registra tu entrada antes de marcar tu salida'),
  emailDuplicado: () => new AppError(409, 'EMAIL_DUPLICADO', 'Ese correo ya está registrado en otro empleado'),
  correoDuplicado: () => new AppError(409, 'EMAIL_DUPLICADO', 'Ese correo ya está registrado con otro usuario'),
  sinRostro: () => new AppError(422, 'SIN_ROSTRO', 'La foto debe tener exactamente un rostro claro'),
  faceNoDisponible: () => new AppError(503, 'SERVICIO_FACIAL_NO_DISPONIBLE', 'El servicio facial no responde'),
};
