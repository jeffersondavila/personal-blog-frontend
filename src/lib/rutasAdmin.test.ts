import { describe, expect, it } from 'vitest';

import { esDestinoInternoDelPanel } from './rutasAdmin';

describe('esDestinoInternoDelPanel', () => {
  it.each(['/admin', '/admin/etiquetas', '/admin/articulos/123', '/admin/etiquetas?page=2'])(
    'acepta el destino interno %s',
    (destino) => {
      expect(esDestinoInternoDelPanel(destino)).toBe(true);
    },
  );

  it.each([
    '/',
    '/articulos',
    '/administrator',
    '/admin-mal',
    'http://example.com/admin',
    'https://example.com/admin',
    '//example.com/admin',
    '',
    null,
    undefined,
    42,
    true,
    {},
    ['/admin'],
  ])('rechaza el destino ajeno al panel o no string %j', (destino) => {
    expect(esDestinoInternoDelPanel(destino)).toBe(false);
  });
});
