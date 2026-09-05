import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RUTAS } from '../lib/rutas';
import { review } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, pagina, respuestaJson, urlDeLlamada, rutasPedidas } from '../test/respuestas';

describe('BookReviewsPage', () => {
  it('muestra las reviews con libro, autor y valoracion, y traslada page y tag al API', async () => {
    const { fetchFn } = renderRuta(`${RUTAS.reviews}?page=2&tag=libros`, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/book-reviews': () => respuestaJson(pagina([review()])),
    });

    const lista = await screen.findByRole('list', { name: /reviews/i });
    expect(within(lista).getByRole('link', { name: 'Review de Clean Code' })).toHaveAttribute(
      'href',
      `${RUTAS.reviews}/clean-code`,
    );
    expect(within(lista).getByText(/4 de 5/)).toBeInTheDocument();
    expect(within(lista).getByText(/Robert C\. Martin/)).toBeInTheDocument();

    const indice = rutasPedidas(fetchFn).findIndex((r) => r.startsWith('/api/v1/book-reviews'));
    const url = urlDeLlamada(fetchFn, indice);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('tag')).toBe('libros');
  });

  it('cubre vacio y error', async () => {
    renderRuta(RUTAS.reviews, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/book-reviews': () => respuestaJson(pagina([])),
    });
    expect(await screen.findByText(/todav[ií]a no hay reviews/i)).toBeInTheDocument();
  });

  it('muestra el error con reintento', async () => {
    renderRuta(RUTAS.reviews, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/book-reviews': () => fallo(),
    });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
