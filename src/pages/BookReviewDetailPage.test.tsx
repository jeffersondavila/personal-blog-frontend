/**
 * Detalle de review (USER_FLOWS A.5): libro, autor, valoracion, enlace externo
 * seguro y contenido Markdown.
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tituloDelDocumento } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { reviewDetallada } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { noEncontrado, respuestaJson } from '../test/respuestas';
// El renderizador Markdown queda resuelto antes de renderizar: sin esto, la
// espera dependeria de cuanto tarde la maquina en transformar `react-markdown`.
import '../test/precargarMarkdown';

describe('BookReviewDetailPage', () => {
  it('muestra la review con libro, autor, valoracion textual y enlace externo seguro', async () => {
    renderRuta(`${RUTAS.reviews}/clean-code`, {
      '/api/v1/book-reviews/clean-code': () => respuestaJson(reviewDetallada()),
    });

    const articulo = await screen.findByRole('article');
    expect(
      within(articulo).getByRole('heading', { level: 1, name: 'Review de Clean Code' }),
    ).toBeInTheDocument();
    expect(within(articulo).getByText(/Clean Code, de Robert C\. Martin/)).toBeInTheDocument();
    expect(within(articulo).getByText(/4 de 5/)).toBeInTheDocument();

    const externo = within(articulo).getByRole('link', { name: /ficha del libro/i });
    expect(externo).toHaveAttribute('href', 'https://editorial.test/clean-code');
    expect(externo).toHaveAttribute('rel', 'noopener noreferrer');

    expect(await within(articulo).findByText('review')).toBeInTheDocument();
    expect(document.title).toBe(tituloDelDocumento('Review de Clean Code'));
  });

  it('sin enlace externo no muestra el enlace', async () => {
    renderRuta(`${RUTAS.reviews}/clean-code`, {
      '/api/v1/book-reviews/clean-code': () =>
        respuestaJson(reviewDetallada({ external_link: null })),
    });

    await screen.findByRole('article');
    expect(screen.queryByRole('link', { name: /ficha del libro/i })).not.toBeInTheDocument();
  });

  it('un 404 del API termina en la pagina 404', async () => {
    renderRuta(`${RUTAS.reviews}/no-existe`, {
      '/api/v1/book-reviews/no-existe': () => noEncontrado(),
    });

    expect(await screen.findByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
  });
});
