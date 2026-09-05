import { describe, expect, it } from 'vitest';

import { formatearFechaLarga } from './date';

describe('formatearFechaLarga', () => {
  it('formatea una fecha ISO en UTC en espanol', () => {
    expect(formatearFechaLarga('2026-08-15T10:00:00Z')).toBe('15 de agosto de 2026');
  });

  it('no cambia de dia por la zona horaria local: la fecha es UTC', () => {
    expect(formatearFechaLarga('2026-08-15T23:30:00Z')).toBe('15 de agosto de 2026');
    expect(formatearFechaLarga('2026-08-16T00:30:00Z')).toBe('16 de agosto de 2026');
  });

  it.each([null, undefined, '', 'no es una fecha'])('devuelve null para %j', (valor) => {
    expect(formatearFechaLarga(valor)).toBeNull();
  });
});
