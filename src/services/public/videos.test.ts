import { describe, expect, it } from 'vitest';

import { fetchVideos } from './videos';
import { createHttpClient } from '../http';
import { crearFetchFalso, pagina, respuestaJson, urlDeLlamada } from '../../test/respuestas';

describe('fetchVideos', () => {
  it('pide /api/v1/videos con page y tag', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/videos': () => respuestaJson(pagina([])) });
    const cliente = createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn });

    await fetchVideos(cliente, { page: 2, tag: 'react' });

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/videos');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('tag')).toBe('react');
  });
});
