// Pruebas del manejo de fechas y tardanzas (src/utils/tiempo.js).
// Sonora es UTC-7 todo el año (sin horario de verano), por eso los días de
// negocio no se pueden calcular con las horas del servidor.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { esTarde, fechaNegocio, horaNegocio, rangoDelDia, restarDias } from '../src/utils/tiempo.js';

// Instante UTC que en Hermosillo (UTC-7) cae a una hora local dada.
const enHermosillo = (hh, mm) => new Date(Date.UTC(2026, 8, 25, hh + 7, mm, 0));
const iso = (d) => d.toISOString();

describe('fechaNegocio', () => {
  it('usa la fecha local de Hermosillo, no la de UTC', () => {
    // 03:00 UTC del 25 -> 20:00 del 24 en Hermosillo: todavía es el día 24
    assert.equal(fechaNegocio(new Date('2026-09-25T03:00:00Z')), '2026-09-24');
    // 12:00 UTC del 25 -> 05:00 del 25: ya es el día 25
    assert.equal(fechaNegocio(new Date('2026-09-25T12:00:00Z')), '2026-09-25');
  });

  it('no se va de día al cruzar la medianoche', () => {
    // 06:59 UTC -> 23:59 del 24
    assert.equal(fechaNegocio(new Date('2026-09-25T06:59:00Z')), '2026-09-24');
    // 07:00 UTC -> 00:00 del 25, empieza el día nuevo
    assert.equal(fechaNegocio(new Date('2026-09-25T07:00:00Z')), '2026-09-25');
  });
});

describe('horaNegocio', () => {
  it('devuelve HH:MM:SS de 24 horas', () => {
    assert.equal(horaNegocio(enHermosillo(8, 5)), '08:05:00');
    assert.equal(horaNegocio(enHermosillo(17, 30)), '17:30:00');
  });

  it('no devuelve 24 en la medianoche (bug clásico de en-GB)', () => {
    assert.equal(horaNegocio(new Date('2026-09-25T07:00:00Z')), '00:00:00');
  });
});

describe('rangoDelDia', () => {
  it('va de las 00:00 a las 24:00 locales, expresadas en UTC', () => {
    const { inicio, fin } = rangoDelDia('2026-09-25');
    assert.equal(iso(inicio), '2026-09-25T07:00:00.000Z');
    assert.equal(iso(fin), '2026-09-26T07:00:00.000Z');
  });

  it('son exactamente 24 horas', () => {
    const { inicio, fin } = rangoDelDia('2026-09-25');
    assert.equal(fin - inicio, 24 * 60 * 60 * 1000);
  });

  it('el inicio cae dentro del día que se pidió', () => {
    const { inicio } = rangoDelDia('2026-12-31');
    assert.equal(fechaNegocio(inicio), '2026-12-31');
  });
});

describe('esTarde', () => {
  it('no marca tardanza antes de la hora de entrada', () => {
    assert.equal(esTarde('08:00:00', 10, enHermosillo(7, 59)), false);
  });

  it('no marca tardanza dentro de la tolerancia', () => {
    assert.equal(esTarde('08:00:00', 10, enHermosillo(8, 5)), false);
  });

  it('no marca tardanza justo en el límite (08:10 con tolerancia 10)', () => {
    assert.equal(esTarde('08:00:00', 10, enHermosillo(8, 10)), false);
  });

  it('marca tardanza un minuto después del límite', () => {
    assert.equal(esTarde('08:00:00', 10, enHermosillo(8, 11)), true);
  });

  it('respeta tolerancias distintas', () => {
    assert.equal(esTarde('09:00:00', 15, enHermosillo(9, 14)), false);
    assert.equal(esTarde('09:00:00', 15, enHermosillo(9, 16)), true);
    assert.equal(esTarde('09:00:00', 0, enHermosillo(9, 0)), false);
    assert.equal(esTarde('09:00:00', 0, enHermosillo(9, 1)), true);
  });
});

// Un rango de "últimos 7 días" salía con 8 días: al restar sobre un instante UTC y
// volver a Hermosillo (UTC-7) el medianoche retrocede al día anterior.
describe('restarDias', () => {
  it('resta días sin corrimiento de zona horaria', () => {
    assert.equal(restarDias('2026-09-29', 6), '2026-09-23');
    assert.equal(restarDias('2026-09-29', 7), '2026-09-22');
    assert.equal(restarDias('2026-09-01', 1), '2026-08-31');
    assert.equal(restarDias('2026-01-01', 1), '2025-12-31');
    assert.equal(restarDias('2026-03-01', 1), '2026-02-28');
  });

  it('con 6 días de resta, desde..hasta son exactamente 7 días', () => {
    const hasta = '2026-09-29';
    const desde = restarDias(hasta, 6);
    const dias = (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86400000;
    assert.equal(dias, 6);
    assert.equal(Number(hasta.slice(8)) - Number(desde.slice(8)), 6);
  });

  it('con 0 días devuelve la misma fecha', () => {
    assert.equal(restarDias('2026-09-29', 0), '2026-09-29');
  });
});
