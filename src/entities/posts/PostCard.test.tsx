import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { PostCard } from './PostCard';
import { RUTAS } from '../../lib/rutas';
import { post } from '../../test/fixtures';

function renderCard(datos = post()) {
  return render(
    <MemoryRouter>
      <ul>
        <PostCard post={datos} />
      </ul>
    </MemoryRouter>,
  );
}

describe('PostCard', () => {
  it('es un li > article con el titulo como enlace al detalle', () => {
    renderCard();

    const articulo = screen.getByRole('article');
    // El `li` externo es el elemento del listado; las etiquetas tienen su propia lista dentro.
    expect(articulo.closest('li')?.parentElement?.tagName).toBe('UL');
    const titulo = within(articulo).getByRole('heading', { level: 2, name: 'Hola mundo' });

    expect(within(titulo).getByRole('link')).toHaveAttribute(
      'href',
      `${RUTAS.articulos}/hola-mundo`,
    );
  });

  it('muestra resumen, fecha, portada con alt y etiquetas enlazadas', () => {
    renderCard();

    expect(screen.getByText('Primer articulo del blog.')).toBeInTheDocument();
    expect(screen.getByText('15 de agosto de 2026').tagName).toBe('TIME');
    expect(screen.getByRole('img', { name: 'Portada del articulo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Docker' })).toHaveAttribute(
      'href',
      `${RUTAS.articulos}?tag=docker`,
    );
  });

  it('sin portada ni resumen no renderiza imagen rota ni parrafo vacio', () => {
    renderCard(post({ cover: null, summary: null, tags: [] }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /etiquetas/i })).not.toBeInTheDocument();
  });
});
