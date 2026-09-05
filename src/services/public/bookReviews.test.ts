import { describe, expect, it } from 'vitest';

import { fetchBookReview, fetchBookReviews } from './bookReviews';
import { createHttpClient } from '../http';
import {
  crearFetchFalso,
  pagina,
  respuestaJson,
  urlDeLlamada,
  type FetchFalso,
} from '../../test/respuestas';

const cliente = (fetchFn: FetchFalso) =>
  createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn });

describe('fetchBookReviews', () => {
  it('pide /api/v1/book-reviews con los parametros del contrato', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/book-reviews': () => respuestaJson(pagina([])) });

    await fetchBookReviews(cliente(fetchFn), { page: 3, tag: 'libros' });

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/book-reviews');
    expect([...url.searchParams.entries()].sort()).toEqual([
      ['page', '3'],
      ['tag', 'libros'],
    ]);
  });
});

describe('fetchBookReview', () => {
  it('pide /api/v1/book-reviews/{slug}', async () => {
    const fetchFn = crearFetchFalso({
      '/api/v1/book-reviews/clean-code': () =>
        respuestaJson({
          slug: 'clean-code',
          title: 'Clean Code',
          summary: null,
          published_at: null,
          tags: [],
          cover: null,
          book_title: 'Clean Code',
          book_author: 'Robert C. Martin',
          rating: 4,
          content: 'Texto',
          reading_time_minutes: 2,
          external_link: null,
          seo_title: null,
          seo_description: null,
        }),
    });

    const review = await fetchBookReview(cliente(fetchFn), 'clean-code');

    expect(urlDeLlamada(fetchFn).pathname).toBe('/api/v1/book-reviews/clean-code');
    expect(review.rating).toBe(4);
  });
});
