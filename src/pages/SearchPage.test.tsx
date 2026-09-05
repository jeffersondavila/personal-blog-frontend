/**
 * Busqueda (USER_FLOWS A.8): termino minimo, resultados planos con tipo,
 * paginacion y sugerencias cuando no hay resultados.
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tituloDelDocumento } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { resultado } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, pagina, respuestaJson, rutasPedidas, urlDeLlamada } from '../test/respuestas';

describe('SearchPage', () => {
  it('con un termino corto no llama al API y explica el minimo', async () => {
    const { fetchFn } = renderRuta(`${RUTAS.buscar}?q=a`);

    expect(await screen.findByText(/al menos 2 caracteres/i)).toBeInTheDocument();
    expect(rutasPedidas(fetchFn).some((r) => r.startsWith('/api/v1/search'))).toBe(false);
    expect(screen.getByRole('heading', { level: 1, name: /b[uú]squeda/i })).toBeInTheDocument();
  });

  it('sin termino tampoco llama al API', async () => {
    const { fetchFn } = renderRuta(RUTAS.buscar);

    await screen.findByRole('heading', { level: 1 });
    expect(rutasPedidas(fetchFn)).toEqual([]);
  });

  it('envia q y page, muestra los resultados con su tipo y enlaza segun el tipo', async () => {
    const { fetchFn } = renderRuta(`${RUTAS.buscar}?q=docker&page=2`, {
      '/api/v1/search': () =>
        respuestaJson(
          pagina(
            [
              resultado(),
              resultado({ type: 'book_review', slug: 'clean-code', title: 'Clean Code' }),
              resultado({ type: 'video', slug: 'intro-docker', title: 'Intro Docker' }),
              resultado({ type: 'project', slug: 'blog', title: 'Blog' }),
            ],
            { page: 2, total: 16, pages: 2 },
          ),
        ),
    });

    const lista = await screen.findByRole('list', { name: /resultados/i });
    const url = urlDeLlamada(fetchFn, 0);
    expect(url.pathname).toBe('/api/v1/search');
    expect([...url.searchParams.entries()].sort()).toEqual([
      ['page', '2'],
      ['q', 'docker'],
    ]);

    expect(within(lista).getByRole('link', { name: 'Hola mundo' })).toHaveAttribute(
      'href',
      `${RUTAS.articulos}/hola-mundo`,
    );
    expect(within(lista).getByRole('link', { name: 'Clean Code' })).toHaveAttribute(
      'href',
      `${RUTAS.reviews}/clean-code`,
    );
    expect(within(lista).getByRole('link', { name: 'Intro Docker' })).toHaveAttribute(
      'href',
      `${RUTAS.videos}#intro-docker`,
    );
    expect(within(lista).getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      `${RUTAS.proyectos}/blog`,
    );
    expect(within(lista).getByText('Artículo')).toBeInTheDocument();
    expect(within(lista).getByText('Review')).toBeInTheDocument();
    expect(within(lista).getByText('Video')).toBeInTheDocument();
    expect(within(lista).getByText('Proyecto')).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/docker/);
    expect(screen.getByRole('navigation', { name: /paginaci[oó]n/i })).toBeInTheDocument();
    expect(document.title).toBe(tituloDelDocumento('Resultados para «docker»'));
  });

  it('sin resultados muestra un mensaje y sugerencias de navegacion', async () => {
    renderRuta(`${RUTAS.buscar}?q=nadaquever`, {
      '/api/v1/search': () => respuestaJson(pagina([])),
    });

    expect(await screen.findByText(/sin resultados para/i)).toBeInTheDocument();
    const sugerencias = screen.getByRole('navigation', { name: /secciones/i });
    expect(within(sugerencias).getByRole('link', { name: /art[ií]culos/i })).toHaveAttribute(
      'href',
      RUTAS.articulos,
    );
  });

  it('ante un fallo ofrece reintentar', async () => {
    renderRuta(`${RUTAS.buscar}?q=docker`, { '/api/v1/search': () => fallo() });

    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('el buscador de la cabecera muestra el termino vigente', async () => {
    renderRuta(`${RUTAS.buscar}?q=docker`, {
      '/api/v1/search': () => respuestaJson(pagina([])),
    });

    const buscador = await screen.findByRole('search');
    expect(within(buscador).getByLabelText(/buscar/i)).toHaveValue('docker');
  });
});
