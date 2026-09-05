/**
 * Comportamiento de la utilidad de contraste.
 *
 * Los valores esperados no son inventados: son los que define la formula de
 * WCAG 2.1 para casos conocidos —blanco contra negro es exactamente 21— y los
 * que producen las combinaciones de referencia del propio estandar. Si la
 * implementacion se desviara, estas pruebas lo detectan antes que cualquier
 * revision visual.
 */
import { describe, expect, it } from 'vitest';

import { contrastRatio, relativeLuminance } from './contrast';

describe('relativeLuminance', () => {
  it('devuelve 0 para el negro y 1 para el blanco', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('aplica la correccion de gamma y no una media lineal', () => {
    // Un gris medio en sRGB (#808080) tiene luminancia ~0.2159, no 0.5. Si la
    // implementacion olvidara linealizar el canal, este valor seria ~0.5.
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2159, 3);
  });

  it('acepta notacion corta de tres digitos', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(relativeLuminance('#ffffff'), 5);
  });

  it('no distingue mayusculas de minusculas', () => {
    expect(relativeLuminance('#AABBCC')).toBeCloseTo(relativeLuminance('#aabbcc'), 5);
  });
});

describe('contrastRatio', () => {
  it('devuelve 21 para el par de maximo contraste', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
  });

  it('devuelve 1 cuando ambos colores son iguales', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('es simetrico: el orden de los colores no altera el resultado', () => {
    const a = contrastRatio('#12467f', '#ffffff');
    const b = contrastRatio('#ffffff', '#12467f');

    expect(a).toBeCloseTo(b, 10);
  });

  it('rechaza un color que no sea hexadecimal valido', () => {
    expect(() => contrastRatio('rojo', '#ffffff')).toThrow(/hexadecimal/i);
    expect(() => contrastRatio('#12345', '#ffffff')).toThrow(/hexadecimal/i);
    expect(() => contrastRatio('#gggggg', '#ffffff')).toThrow(/hexadecimal/i);
  });
});
