/**
 * Estado vacio comprensible: un mensaje y, si el consumidor lo aporta, una salida.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('muestra el mensaje', () => {
    render(<EmptyState mensaje="Todavía no hay artículos publicados." />);

    expect(screen.getByText('Todavía no hay artículos publicados.')).toBeInTheDocument();
  });

  it('muestra los hijos como salida cuando los hay', () => {
    render(
      <EmptyState mensaje="Sin resultados.">
        <a href="/articulos">Ver artículos</a>
      </EmptyState>,
    );

    expect(screen.getByRole('link', { name: 'Ver artículos' })).toBeInTheDocument();
  });
});
