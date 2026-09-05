/**
 * Comportamiento de `Stack`.
 *
 * `Stack` es el unico mecanismo de separacion del sistema: existe para que
 * ninguna pagina de `Task/014` o `Task/015` escriba un margen suelto, que es
 * lo que `CONTRIBUTING.md` seccion 6 prohibe expresamente.
 *
 * Se comprueba su contrato de API. La separacion real la aplica `gap` en CSS,
 * que JSDOM no calcula.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stack } from './Stack';

/** Devuelve las clases del elemento con el `data-testid` indicado. */
function classesOf(testId: string): string {
  return screen.getByTestId(testId).className;
}

describe('Stack', () => {
  it('renderiza a sus hijos en un elemento generico', () => {
    render(
      <Stack data-testid="pila">
        <span>uno</span>
        <span>dos</span>
      </Stack>,
    );

    expect(screen.getByTestId('pila').tagName).toBe('DIV');
    expect(screen.getByText('uno')).toBeInTheDocument();
    expect(screen.getByText('dos')).toBeInTheDocument();
  });

  it('distingue el eje vertical del horizontal', () => {
    const { rerender } = render(
      <Stack direction="vertical" data-testid="pila">
        <span>uno</span>
      </Stack>,
    );
    const vertical = classesOf('pila');

    rerender(
      <Stack direction="horizontal" data-testid="pila">
        <span>uno</span>
      </Stack>,
    );

    expect(classesOf('pila')).not.toBe(vertical);
  });

  it('apila en vertical por defecto', () => {
    const { rerender } = render(
      <Stack data-testid="pila">
        <span>uno</span>
      </Stack>,
    );
    const porDefecto = classesOf('pila');

    rerender(
      <Stack direction="vertical" data-testid="pila">
        <span>uno</span>
      </Stack>,
    );

    expect(classesOf('pila')).toBe(porDefecto);
  });

  it('aplica una clase distinta por cada paso de la escala de espaciado', () => {
    const gaps = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
    const vistas = new Set<string>();

    for (const gap of gaps) {
      const { unmount } = render(
        <Stack gap={gap} data-testid="pila">
          <span>uno</span>
        </Stack>,
      );
      vistas.add(classesOf('pila'));
      unmount();
    }

    expect(vistas.size).toBe(gaps.length);
  });

  it('permite envolver el contenido cuando no cabe en una linea', () => {
    const { rerender } = render(
      <Stack direction="horizontal" data-testid="pila">
        <span>uno</span>
      </Stack>,
    );
    const sinEnvoltura = classesOf('pila');

    rerender(
      <Stack direction="horizontal" wrap data-testid="pila">
        <span>uno</span>
      </Stack>,
    );

    expect(classesOf('pila')).not.toBe(sinEnvoltura);
  });

  it('distingue las alineaciones disponibles', () => {
    const alineaciones = ['start', 'center', 'end', 'stretch'] as const;
    const vistas = new Set<string>();

    for (const align of alineaciones) {
      const { unmount } = render(
        <Stack align={align} data-testid="pila">
          <span>uno</span>
        </Stack>,
      );
      vistas.add(classesOf('pila'));
      unmount();
    }

    expect(vistas.size).toBe(alineaciones.length);
  });

  it('conserva los atributos y la clase del consumidor', () => {
    render(
      <Stack id="acciones" className="clase-propia" data-testid="pila">
        <span>uno</span>
      </Stack>,
    );

    const pila = screen.getByTestId('pila');

    expect(pila).toHaveAttribute('id', 'acciones');
    expect(pila.className).toContain('clase-propia');
  });
});
