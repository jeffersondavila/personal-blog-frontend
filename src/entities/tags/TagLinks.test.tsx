/**
 * Etiquetas de un contenido como enlaces al listado filtrado de su tipo (A.9).
 */
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { TagLinks } from './TagLinks';
import { RUTAS } from '../../lib/rutas';
import { etiqueta } from '../../test/fixtures';

describe('TagLinks', () => {
  it('enlaza cada etiqueta al listado de la seccion filtrado por su slug', () => {
    render(
      <MemoryRouter>
        <TagLinks
          seccion={RUTAS.reviews}
          tags={[etiqueta(), etiqueta({ slug: 'libros', name: 'Libros' })]}
        />
      </MemoryRouter>,
    );

    const lista = screen.getByRole('list', { name: /etiquetas/i });
    const enlaces = within(lista).getAllByRole('link');

    expect(enlaces.map((enlace) => enlace.textContent)).toEqual(['Docker', 'Libros']);
    expect(enlaces[0]).toHaveAttribute('href', `${RUTAS.reviews}?tag=docker`);
    expect(enlaces[1]).toHaveAttribute('href', `${RUTAS.reviews}?tag=libros`);
  });

  it('no renderiza nada sin etiquetas', () => {
    const { container } = render(
      <MemoryRouter>
        <TagLinks seccion={RUTAS.articulos} tags={[]} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
