import { describe, expect, it } from 'vitest';

import { formatearDuracion } from './duration';

describe('formatearDuracion', () => {
  it.each([
    [45, '45 s'],
    [60, '1 min'],
    [754, '12 min'],
    [3600, '1 h'],
    [3725, '1 h 2 min'],
  ])('%i segundos → %s', (segundos, esperado) => {
    expect(formatearDuracion(segundos)).toBe(esperado);
  });

  it.each([null, undefined, 0, -5, Number.NaN])('devuelve null para %j', (valor) => {
    expect(formatearDuracion(valor)).toBeNull();
  });
});
