import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RUTAS } from '../lib/rutas';
import { proyecto } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, pagina, respuestaJson, rutasPedidas, urlDeLlamada } from '../test/respuestas';

describe('ProjectsPage', () => {
  it('lista los proyectos con estado, tecnologias y enlaces, y traslada page y tag', async () => {
    const { fetchFn } = renderRuta(`${RUTAS.proyectos}?page=3&tag=react`, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/projects': () => respuestaJson(pagina([proyecto()])),
    });

    const lista = await screen.findByRole('list', { name: /proyectos/i });
    expect(within(lista).getByRole('link', { name: 'Blog personal' })).toHaveAttribute(
      'href',
      `${RUTAS.proyectos}/blog-personal`,
    );
    expect(within(lista).getByText('Activo')).toBeInTheDocument();
    expect(within(lista).getByRole('link', { name: /repositorio/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );

    const indice = rutasPedidas(fetchFn).findIndex((r) => r.startsWith('/api/v1/projects'));
    const url = urlDeLlamada(fetchFn, indice);
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('tag')).toBe('react');
  });

  it('cubre vacio', async () => {
    renderRuta(RUTAS.proyectos, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/projects': () => respuestaJson(pagina([])),
    });
    expect(await screen.findByText(/todav[ií]a no hay proyectos/i)).toBeInTheDocument();
  });

  it('cubre error con reintento', async () => {
    renderRuta(RUTAS.proyectos, {
      '/api/v1/tags': () => respuestaJson(pagina([])),
      '/api/v1/projects': () => fallo(),
    });
    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
