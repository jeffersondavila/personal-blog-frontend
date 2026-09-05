/**
 * Estado de carga: anunciado con `role="status"`, sin secuestrar el foco.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('anuncia la carga con role=status y un texto por defecto', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent(/cargando/i);
  });

  it('admite un texto propio del consumidor', () => {
    render(<LoadingState>Cargando artículos…</LoadingState>);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando artículos…');
  });

  it('no mueve el foco', () => {
    render(<LoadingState />);

    expect(document.activeElement).toBe(document.body);
  });
});
