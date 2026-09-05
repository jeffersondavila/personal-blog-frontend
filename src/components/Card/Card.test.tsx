/**
 * Comportamiento de `Card`.
 *
 * `Card` es una superficie: fondo, borde y radio. No tiene variantes porque
 * ningun consumidor actual necesita mas de una, y no impone semantica porque
 * el elemento correcto —`article` para un articulo de listado, `li` dentro de
 * una lista— lo decide la pagina (**A-02**, `Task/014`).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  it('renderiza a sus hijos', () => {
    render(
      <Card>
        <h2>Titulo</h2>
        <p>Resumen</p>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Titulo' })).toBeInTheDocument();
    expect(screen.getByText('Resumen')).toBeInTheDocument();
  });

  it('renderiza un elemento generico y no impone semantica', () => {
    render(<Card data-testid="tarjeta">contenido</Card>);

    expect(screen.getByTestId('tarjeta').tagName).toBe('DIV');
  });

  it('no introduce ningun rol implicito', () => {
    render(<Card data-testid="tarjeta">contenido</Card>);

    expect(screen.getByTestId('tarjeta')).not.toHaveAttribute('role');
  });

  it('conserva los atributos y la clase del consumidor', () => {
    render(
      <Card id="destacado" className="clase-propia" data-testid="tarjeta">
        contenido
      </Card>,
    );

    const tarjeta = screen.getByTestId('tarjeta');

    expect(tarjeta).toHaveAttribute('id', 'destacado');
    expect(tarjeta.className).toContain('clase-propia');
    expect(tarjeta.className.split(' ').length).toBeGreaterThan(1);
  });
});
