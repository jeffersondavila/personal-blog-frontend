import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RUTAS } from '../lib/rutas';
import { video } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, pagina, respuestaJson, rutasPedidas, urlDeLlamada } from '../test/respuestas';

describe('VideosPage', () => {
  it('lista los videos con id=slug, boton Reproducir y enlace externo, y traslada page y tag', async () => {
    const { fetchFn } = renderRuta(`${RUTAS.videos}?page=2&tag=docker`, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/videos': () =>
        respuestaJson(
          pagina([video(), video({ slug: 'otro', title: 'Otro', provider: 'desconocido' })]),
        ),
    });

    const lista = await screen.findByRole('list', { name: /videos/i });
    const items = within(lista)
      .getAllByRole('article')
      .map((a) => a.closest('li'));
    expect(items.map((li) => li?.getAttribute('id'))).toEqual(['intro-docker', 'otro']);
    expect(within(lista).getAllByRole('button', { name: /reproducir/i })).toHaveLength(1);
    expect(within(lista).getAllByRole('link', { name: /ver/i })).toHaveLength(2);

    const indice = rutasPedidas(fetchFn).findIndex((r) => r.startsWith('/api/v1/videos'));
    const url = urlDeLlamada(fetchFn, indice);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('tag')).toBe('docker');
  });

  it('cubre vacio', async () => {
    renderRuta(RUTAS.videos, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/videos': () => respuestaJson(pagina([])),
    });
    expect(await screen.findByText(/todav[ií]a no hay videos/i)).toBeInTheDocument();
  });

  it('cubre error con reintento', async () => {
    renderRuta(RUTAS.videos, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/videos': () => fallo(),
    });
    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
