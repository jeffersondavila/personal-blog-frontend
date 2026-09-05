import { describe, expect, it } from 'vitest';

import { fetchTags } from './tags';
import { createHttpClient } from '../http';
import { crearFetchFalso, pagina, respuestaJson, urlDeLlamada } from '../../test/respuestas';

describe('fetchTags', () => {
  it('pide /api/v1/tags con el page_size maximo del contrato y nada mas', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/tags': () => respuestaJson(pagina([])) });
    const cliente = createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn });

    await fetchTags(cliente);

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/tags');
    expect([...url.searchParams.entries()]).toEqual([['page_size', '50']]);
  });
});
