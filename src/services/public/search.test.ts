import { describe, expect, it } from 'vitest';

import { fetchSearch, LONGITUD_MINIMA_DE_BUSQUEDA, normalizarTermino } from './search';
import { createHttpClient } from '../http';
import { crearFetchFalso, pagina, respuestaJson, urlDeLlamada } from '../../test/respuestas';

describe('fetchSearch', () => {
  it('pide /api/v1/search con q recortado y page', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/search': () => respuestaJson(pagina([])) });
    const cliente = createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn });

    await fetchSearch(cliente, { q: '  docker ', page: 2 });

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/search');
    expect([...url.searchParams.entries()].sort()).toEqual([
      ['page', '2'],
      ['q', 'docker'],
    ]);
  });
});

describe('normalizarTermino', () => {
  it('recorta espacios y acepta desde el minimo del contrato', () => {
    expect(LONGITUD_MINIMA_DE_BUSQUEDA).toBe(2);
    expect(normalizarTermino('  go ')).toBe('go');
  });

  it.each([null, undefined, '', ' ', 'a', ' a '])('devuelve null para %j', (valor) => {
    expect(normalizarTermino(valor)).toBeNull();
  });
});
