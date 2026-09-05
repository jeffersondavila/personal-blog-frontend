import { describe, expect, it } from 'vitest';

import { fetchProfile } from './profile';
import { createHttpClient, HttpError } from '../http';
import {
  crearFetchFalso,
  noEncontrado,
  respuestaJson,
  urlDeLlamada,
  type FetchFalso,
} from '../../test/respuestas';

const cliente = (fetchFn: FetchFalso) =>
  createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn });

describe('fetchProfile', () => {
  it('pide /api/v1/profile sin parametros', async () => {
    const fetchFn = crearFetchFalso({
      '/api/v1/profile': () =>
        respuestaJson({
          full_name: 'Autora',
          headline: null,
          biography: 'Hola',
          contact_email: null,
          photo: null,
          seo_title: null,
          seo_description: null,
          social_links: [],
        }),
    });

    const perfil = await fetchProfile(cliente(fetchFn));

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/profile');
    expect(url.search).toBe('');
    expect(perfil.full_name).toBe('Autora');
  });

  it('propaga el 404 previo a la semilla (D-009-N) como HttpError 404', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/profile': () => noEncontrado() });

    const error = (await fetchProfile(cliente(fetchFn)).catch((c: unknown) => c)) as HttpError;

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
  });
});
