import { config } from '../config.js';

// Devuelve la fecha "de negocio" (YYYY-MM-DD) en America/Hermosillo.
export function fechaNegocio(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.tzNegocio }).format(date);
}

// Hora local HH:MM:SS en America/Hermosillo.
export function horaNegocio(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: config.tzNegocio, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
}

// Rango UTC [inicio, fin) del día de negocio. Sonora es UTC-7 todo el año (sin horario de verano).
export function rangoDelDia(fecha = fechaNegocio()) {
  const inicio = new Date(`${fecha}T00:00:00-07:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

// ¿La hora local supera hora_entrada + tolerancia?
export function esTarde(horaEntrada, toleranciaMin, date = new Date()) {
  const [h, m] = horaEntrada.split(':').map(Number);
  const [hl, ml] = horaNegocio(date).split(':').map(Number);
  return hl * 60 + ml > h * 60 + m + Number(toleranciaMin);
}
