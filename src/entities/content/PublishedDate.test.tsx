import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublishedDate } from './PublishedDate';

describe('PublishedDate', () => {
  it('emite un <time> legible por maquina con la fecha ISO y un texto en espanol', () => {
    render(<PublishedDate fecha="2026-08-15T10:00:00Z" />);

    const tiempo = screen.getByText('15 de agosto de 2026');
    expect(tiempo.tagName).toBe('TIME');
    expect(tiempo).toHaveAttribute('dateTime', '2026-08-15T10:00:00Z');
  });

  it('no renderiza nada sin fecha', () => {
    const { container } = render(<PublishedDate fecha={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
