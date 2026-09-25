// Las variables EXPO_PUBLIC_* se leen del archivo .env al compilar.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.50:3000';

export const FOTO = {
  anchoMaximo: 1024, // px
  calidad: 0.7, // JPEG 70% (PDF: "comprimir a JPEG 70%")
};
