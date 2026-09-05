/**
 * Comportamiento de `Container`.
 *
 * `Container` resuelve una sola cosa: el ancho de la columna de contenido y su
 * margen lateral. Lo que se puede comprobar en JSDOM es su contrato de API
 * —que renderiza un elemento generico, que distingue los dos anchos y que no
 * se traga las props del consumidor—; que el ancho *se aplique* es CSS, y se
 * verifica por inspeccion del modulo y en el navegador.
 *
 * Renderiza un `<div>` a proposito: los landmarks (`main`, `nav`, `article`)
 * son decision de la pagina que lo usa, porque el HTML semantico (**A-02**) es
 * responsabilidad de `Task/014`.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Container } from './Container';

describe('Container', () => {
  it('renderiza a sus hijos', () => {
    render(<Container>contenido</Container>);

    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('renderiza un elemento generico y no impone ningun landmark', () => {
    render(<Container data-testid="contenedor">contenido</Container>);

    expect(screen.getByTestId('contenedor').tagName).toBe('DIV');
  });

  it('distingue el ancho de lectura del ancho amplio', () => {
    const { rerender } = render(
      <Container width="prose" data-testid="contenedor">
        texto
      </Container>,
    );
    const prose = screen.getByTestId('contenedor').className;

    rerender(
      <Container width="wide" data-testid="contenedor">
        texto
      </Container>,
    );
    const wide = screen.getByTestId('contenedor').className;

    expect(prose).not.toBe(wide);
  });

  it('usa el ancho de lectura por defecto', () => {
    const { rerender } = render(<Container data-testid="contenedor">texto</Container>);
    const porDefecto = screen.getByTestId('contenedor').className;

    rerender(
      <Container width="prose" data-testid="contenedor">
        texto
      </Container>,
    );

    expect(screen.getByTestId('contenedor').className).toBe(porDefecto);
  });

  it('conserva los atributos y la clase del consumidor', () => {
    render(
      <Container id="principal" className="clase-propia" data-testid="contenedor">
        texto
      </Container>,
    );

    const contenedor = screen.getByTestId('contenedor');

    expect(contenedor).toHaveAttribute('id', 'principal');
    expect(contenedor.className).toContain('clase-propia');
    expect(contenedor.className.split(' ').length).toBeGreaterThan(1);
  });
});
