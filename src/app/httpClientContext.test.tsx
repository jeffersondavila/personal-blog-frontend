/**
 * El cliente HTTP compartido llega a las paginas por contexto, y usarlo sin
 * proveedor es un error inmediato en lugar de una peticion a un origen
 * inventado (misma postura que `appConfigContext`).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HttpClientContext, useHttpClient } from './httpClientContext';
import { createHttpClient } from '../services/http';

function Sonda() {
  const cliente = useHttpClient();
  return <output>{typeof cliente.request}</output>;
}

describe('useHttpClient', () => {
  it('devuelve el cliente provisto', () => {
    const cliente = createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn: vi.fn() });

    render(
      <HttpClientContext value={cliente}>
        <Sonda />
      </HttpClientContext>,
    );

    expect(screen.getByText('function')).toBeInTheDocument();
  });

  it('falla de forma explicita fuera del proveedor', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Sonda />)).toThrow(/HttpClientContext/);
  });
});
