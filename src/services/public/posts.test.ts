/**
 * Adaptador publico de articulos: `GET /api/v1/posts` y `GET /api/v1/posts/{slug}`.
 */
import { describe, expect, it } from 'vitest';

import { fetchPost, fetchPosts } from './posts';
import { createHttpClient, HttpError } from '../http';
import {
  crearFetchFalso,
  noEncontrado,
  pagina,
  respuestaJson,
  urlDeLlamada,
  type FetchFalso,
} from '../../test/respuestas';

const BASE = 'http://api.de-prueba.test';

function cliente(fetchFn: FetchFalso) {
  return createHttpClient({ baseUrl: BASE, fetchFn });
}

describe('fetchPosts', () => {
  it('pide /api/v1/posts sin ningun parametro cuando no se filtra', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/posts': () => respuestaJson(pagina([])) });

    await fetchPosts(cliente(fetchFn));

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/posts');
    expect([...url.searchParams.keys()]).toEqual([]);
  });

  it('serializa page y tag solo cuando existen', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/posts': () => respuestaJson(pagina([])) });

    await fetchPosts(cliente(fetchFn), { page: 2, tag: 'docker' });

    const url = urlDeLlamada(fetchFn);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('tag')).toBe('docker');
    expect([...url.searchParams.keys()].sort()).toEqual(['page', 'tag']);
  });

  it('envia featured=true y page_size solo para los destacados', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/posts': () => respuestaJson(pagina([])) });

    await fetchPosts(cliente(fetchFn), { featured: true, pageSize: 3 });

    const url = urlDeLlamada(fetchFn);
    expect(url.searchParams.get('featured')).toBe('true');
    expect(url.searchParams.get('page_size')).toBe('3');
    expect([...url.searchParams.keys()].sort()).toEqual(['featured', 'page_size']);
  });

  it('devuelve la pagina tipada', async () => {
    const cuerpo = pagina([
      { slug: 'hola', title: 'Hola', summary: null, published_at: null, tags: [], cover: null },
    ]);
    const fetchFn = crearFetchFalso({ '/api/v1/posts': () => respuestaJson(cuerpo) });

    const resultado = await fetchPosts(cliente(fetchFn));

    expect(resultado.items[0]?.slug).toBe('hola');
    expect(resultado.total).toBe(1);
  });

  it('rechaza una envoltura malformada como respuesta invalida', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/posts': () => respuestaJson({ resultados: [] }) });

    await expect(fetchPosts(cliente(fetchFn))).rejects.toMatchObject({ kind: 'invalid_response' });
  });

  it('propaga el signal de cancelacion hasta fetch', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/posts': () => respuestaJson(pagina([])) });
    const controlador = new AbortController();

    await fetchPosts(cliente(fetchFn), {}, controlador.signal);

    expect(fetchFn.mock.calls[0]?.[1]?.signal).toBe(controlador.signal);
  });
});

describe('fetchPost', () => {
  it('pide /api/v1/posts/{slug}', async () => {
    const fetchFn = crearFetchFalso({
      '/api/v1/posts/mi-articulo': () =>
        respuestaJson({
          slug: 'mi-articulo',
          title: 'Mi articulo',
          summary: null,
          published_at: '2026-08-01T00:00:00Z',
          tags: [],
          cover: null,
          content: '# Hola',
          reading_time_minutes: 1,
          seo_title: null,
          seo_description: null,
        }),
    });

    const post = await fetchPost(cliente(fetchFn), 'mi-articulo');

    expect(urlDeLlamada(fetchFn).pathname).toBe('/api/v1/posts/mi-articulo');
    expect(post.content).toBe('# Hola');
  });

  it('codifica el slug en la ruta para que no pueda escapar del recurso', async () => {
    const fetchFn = crearFetchFalso({});

    await fetchPost(cliente(fetchFn), '../admin/posts').catch(() => undefined);

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/posts/..%2Fadmin%2Fposts');
  });

  it('propaga el 404 del contrato como HttpError con code resource_not_found', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/posts/no-existe': () => noEncontrado() });

    const error = (await fetchPost(cliente(fetchFn), 'no-existe').catch(
      (c: unknown) => c,
    )) as HttpError;

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('resource_not_found');
  });
});
