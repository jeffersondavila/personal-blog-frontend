/**
 * Lista cerrada de proveedores de video (decision D-014-C; CONTENT_MODEL 3.4,
 * security-boundaries 5 y 7). Todo lo que no este en la lista es fail-closed.
 */
import { describe, expect, it } from 'vitest';

import { PROVEEDORES_PERMITIDOS, urlDeEmbed } from './providers';

describe('proveedores de video', () => {
  it('la lista cerrada es exactamente youtube y vimeo', () => {
    expect([...PROVEEDORES_PERMITIDOS].sort()).toEqual(['vimeo', 'youtube']);
  });

  it('construye el embed de YouTube sin cookies a partir de un id valido', () => {
    expect(urlDeEmbed('youtube', 'dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });

  it('construye el embed de Vimeo a partir de un id numerico', () => {
    expect(urlDeEmbed('vimeo', '123456789')).toBe('https://player.vimeo.com/video/123456789');
  });

  it('compara el proveedor sin distinguir mayusculas ni espacios', () => {
    expect(urlDeEmbed(' YouTube ', 'dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });

  it.each([
    ['dailymotion', 'x7abcd'],
    ['tiktok', '123'],
    ['', 'dQw4w9WgXcQ'],
    [null, 'dQw4w9WgXcQ'],
  ])('un proveedor fuera de la lista (%j) no produce embed', (proveedor, referencia) => {
    expect(urlDeEmbed(proveedor, referencia)).toBeNull();
  });

  it.each([
    ['youtube', 'corto'],
    ['youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['youtube', 'dQw4w9WgXcQ"><script>'],
    ['youtube', '../../etc'],
    ['youtube', null],
    ['vimeo', 'abc'],
    ['vimeo', '12'],
    ['vimeo', '123/../x'],
  ])('una referencia malformada para %s (%j) no produce embed', (proveedor, referencia) => {
    expect(urlDeEmbed(proveedor, referencia)).toBeNull();
  });
});
