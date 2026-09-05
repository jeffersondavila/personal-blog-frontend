/**
 * Estado de error navegable: mensaje generico y accion de reintento (A.1).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('se anuncia como alerta con un mensaje generico', () => {
    render(<ErrorState onRetry={() => undefined} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo cargar/i);
  });

  it('ofrece un boton nativo Reintentar que invoca onRetry', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    const boton = screen.getByRole('button', { name: /reintentar/i });
    expect(boton.tagName).toBe('BUTTON');

    boton.click();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('admite un mensaje propio, pero sigue sin exponer detalles internos', () => {
    render(<ErrorState mensaje="No se pudo cargar el perfil." onRetry={() => undefined} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el perfil.');
    expect(screen.queryByText(/traceback|sql|exception/i)).not.toBeInTheDocument();
  });
});
