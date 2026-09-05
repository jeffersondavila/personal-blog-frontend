/**
 * Listado de articulos (USER_FLOWS A.2, A.9): estados, paginacion y filtro por
 * etiqueta como estado de la URL.
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tituloDelDocumento } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { etiqueta, post } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, pagina, respuestaJson, rutasPedidas, urlDeLlamada } from '../test/respuestas';

const TAGS = { '/api/v1/tags': () => respuestaJson(pagina([etiqueta()])) };

describe('PostsPage', () => {
  it('anuncia la carga y despues muestra los articulos como ul > li > article', async () => {
    renderRuta(RUTAS.articulos, {
      ...TAGS,
      '/api/v1/posts': () => respuestaJson(pagina([post(), post({ slug: 'otro', title: 'Otro' })])),
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/cargando/i);

    const lista = await screen.findByRole('list', { name: /art[ií]culos/i });
    const articulos = within(lista).getAllByRole('article');
    expect(articulos).toHaveLength(2);
    expect(articulos[0]?.closest('li')?.parentElement).toBe(lista);
    expect(within(lista).getByRole('link', { name: 'Otro' })).toHaveAttribute(
      'href',
      `${RUTAS.articulos}/otro`,
    );
    expect(document.title).toBe(tituloDelDocumento('Artículos'));
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('muestra un mensaje explicativo cuando no hay articulos, no una lista vacia', async () => {
    renderRuta(RUTAS.articulos, { ...TAGS, '/api/v1/posts': () => respuestaJson(pagina([])) });

    expect(await screen.findByText(/todav[ií]a no hay art[ií]culos/i)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /art[ií]culos/i })).not.toBeInTheDocument();
  });

  it('ante un fallo muestra el error con Reintentar y reintentar repite la peticion', async () => {
    let intentos = 0;
    const { fetchFn } = renderRuta(RUTAS.articulos, {
      ...TAGS,
      '/api/v1/posts': () => {
        intentos += 1;
        return intentos === 1 ? fallo() : respuestaJson(pagina([post()]));
      },
    });

    const alerta = await screen.findByRole('alert');
    expect(alerta).not.toHaveTextContent(/traza interna/);

    await act(async () => {
      fireEvent.click(within(alerta).getByRole('button', { name: /reintentar/i }));
      await Promise.resolve();
    });

    expect(await screen.findByRole('link', { name: 'Hola mundo' })).toBeInTheDocument();
    expect(rutasPedidas(fetchFn).filter((r) => r.startsWith('/api/v1/posts')).length).toBe(2);
  });

  it('traslada ?page= y ?tag= de la URL al API y muestra el filtro activo con Quitar filtro', async () => {
    const { fetchFn } = renderRuta(`${RUTAS.articulos}?page=2&tag=docker`, {
      ...TAGS,
      '/api/v1/posts': () => respuestaJson(pagina([post()], { page: 2, total: 13, pages: 2 })),
    });

    await screen.findByRole('link', { name: 'Hola mundo' });

    const llamadaAPosts = rutasPedidas(fetchFn).findIndex((r) => r.startsWith('/api/v1/posts'));
    const url = urlDeLlamada(fetchFn, llamadaAPosts);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('tag')).toBe('docker');
    expect([...url.searchParams.keys()].sort()).toEqual(['page', 'tag']);

    expect(screen.getByText(/filtrando por la etiqueta/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /quitar filtro/i })).toHaveAttribute(
      'href',
      RUTAS.articulos,
    );
  });

  it('no reenvia al API parametros ajenos presentes en la URL', async () => {
    const { fetchFn } = renderRuta(`${RUTAS.articulos}?utm_source=boletin&page=1`, {
      ...TAGS,
      '/api/v1/posts': () => respuestaJson(pagina([])),
    });

    await waitFor(() => {
      expect(rutasPedidas(fetchFn).some((r) => r.startsWith('/api/v1/posts'))).toBe(true);
    });
    const url = urlDeLlamada(
      fetchFn,
      rutasPedidas(fetchFn).findIndex((r) => r.startsWith('/api/v1/posts')),
    );
    expect(url.searchParams.has('utm_source')).toBe(false);
  });

  it('muestra la paginacion cuando hay mas de una pagina y conserva la etiqueta en sus enlaces', async () => {
    renderRuta(`${RUTAS.articulos}?tag=docker`, {
      ...TAGS,
      '/api/v1/posts': () => respuestaJson(pagina([post()], { total: 25, pages: 3 })),
    });

    const nav = await screen.findByRole('navigation', { name: /paginaci[oó]n/i });
    const siguiente = within(nav).getByRole('link', { name: /siguiente/i });
    const url = new URL(siguiente.getAttribute('href') ?? '', 'http://sitio.test');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('tag')).toBe('docker');
  });

  it('el mensaje de vacio con filtro explica el filtro y ofrece quitarlo', async () => {
    renderRuta(`${RUTAS.articulos}?tag=docker`, {
      ...TAGS,
      '/api/v1/posts': () => respuestaJson(pagina([])),
    });

    expect(
      await screen.findByText(/no hay art[ií]culos publicados con la etiqueta/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /quitar filtro|ver todos/i }).length,
    ).toBeGreaterThan(0);
  });
});
