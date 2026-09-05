/**
 * Valoracion de una review: el texto es el portador del significado (A-07).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Rating } from './Rating';

describe('Rating', () => {
  it('muestra la valoracion como texto «N de 5»', () => {
    render(<Rating rating={4} />);

    expect(screen.getByText(/4 de 5/)).toBeInTheDocument();
  });

  it('los glifos son decorativos y no entran en el nombre accesible', () => {
    render(<Rating rating={3} />);

    const glifos = document.querySelector('[aria-hidden="true"]');
    expect(glifos).not.toBeNull();
    expect(glifos?.textContent).toMatch(/★{3}☆{2}/);
    expect(screen.getByText(/valoraci[oó]n/i)).toHaveTextContent('3 de 5');
  });

  it('no renderiza nada sin valoracion', () => {
    const { container } = render(<Rating rating={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('acota valores fuera de la escala sin romper', () => {
    render(<Rating rating={9} />);

    expect(screen.getByText(/5 de 5/)).toBeInTheDocument();
  });
});
