/**
 * Filtro por etiqueta de los cuatro listados: consume `GET /api/v1/tags`
 * (USER_FLOWS A.9) y produce enlaces compartibles.
 */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { TagFilter } from './TagFilter';
import { HttpClientContext } from '../../app/httpClientContext';
import { RUTAS } from '../../lib/rutas';
import { createHttpClient } from '../../services/http';
import { etiqueta } from '../../test/fixtures';
import { crearFetchFalso, fallo, pagina, respuestaJson } from '../../test/respuestas';

function renderFiltro(fetchFn: ReturnType<typeof crearFetchFalso>, ruta: string = RUTAS.articulos) {
  const cliente = createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn });
  return render(
    <HttpClientContext value={cliente}>
      <MemoryRouter initialEntries={[ruta]}>
        <TagFilter seccion={RUTAS.articulos} />
      </MemoryRouter>
    </HttpClientContext>,
  );
}

describe('TagFilter', () => {
  it('pide el catalogo de etiquetas y enlaza cada una al listado filtrado', async () => {
    const fetchFn = crearFetchFalso({
      '/api/v1/tags': () =>
        respuestaJson(pagina([etiqueta(), etiqueta({ slug: 'react', name: 'React' })])),
    });

    renderFiltro(fetchFn);

    const nav = await screen.findByRole('navigation', { name: /filtrar por etiqueta/i });
    const enlaces = within(nav).getAllByRole('link');
    expect(enlaces.map((e) => e.getAttribute('href'))).toEqual([
      `${RUTAS.articulos}?tag=docker`,
      `${RUTAS.articulos}?tag=react`,
    ]);
    expect(new URL(fetchFn.mock.calls[0]?.[0] as string).searchParams.get('page_size')).toBe('50');
  });

  it('marca la etiqueta activa con aria-current y ofrece quitar el filtro', async () => {
    const fetchFn = crearFetchFalso({
      '/api/v1/tags': () => respuestaJson(pagina([etiqueta()])),
    });

    renderFiltro(fetchFn, `${RUTAS.articulos}?tag=docker`);

    const nav = await screen.findByRole('navigation', { name: /filtrar por etiqueta/i });
    expect(within(nav).getByRole('link', { name: 'Docker' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(within(nav).getByRole('link', { name: /quitar filtro/i })).toHaveAttribute(
      'href',
      RUTAS.articulos,
    );
  });

  it('no muestra nada si el catalogo esta vacio: el filtro es opcional', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/tags': () => respuestaJson(pagina([])) });
    renderFiltro(fetchFn);

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('no muestra nada ni una alerta si el catalogo falla: el listado ya tiene su propio error', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/tags': () => fallo() });
    renderFiltro(fetchFn);

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
