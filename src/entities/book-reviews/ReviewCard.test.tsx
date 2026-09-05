import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ReviewCard } from './ReviewCard';
import { RUTAS } from '../../lib/rutas';
import { review } from '../../test/fixtures';

describe('ReviewCard', () => {
  it('enlaza al detalle y muestra libro, autor y valoracion textual (A.4)', () => {
    render(
      <MemoryRouter>
        <ul>
          <ReviewCard review={review()} />
        </ul>
      </MemoryRouter>,
    );

    const articulo = screen.getByRole('article');
    expect(within(articulo).getByRole('link', { name: 'Review de Clean Code' })).toHaveAttribute(
      'href',
      `${RUTAS.reviews}/clean-code`,
    );
    expect(
      within(articulo).getByText(/Clean Code/, { selector: 'p, span, dd' }),
    ).toBeInTheDocument();
    expect(within(articulo).getByText(/Robert C\. Martin/)).toBeInTheDocument();
    expect(within(articulo).getByText(/4 de 5/)).toBeInTheDocument();
    expect(within(articulo).getByRole('link', { name: 'Libros' })).toHaveAttribute(
      'href',
      `${RUTAS.reviews}?tag=libros`,
    );
  });
});
