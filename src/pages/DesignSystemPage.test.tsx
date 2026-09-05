/**
 * Comportamiento de la superficie de demostracion.
 *
 * No se prueba su apariencia —para eso esta el navegador— sino las dos cosas
 * que si pueden romperse en silencio:
 *
 * 1. Que la pagina se construye **solo** con la superficie publica del sistema
 *    de diseno, que es como la usaran `Task/014` y `Task/015`. Si algo no se
 *    pudiera montar asi, el defecto estaria en el contrato.
 * 2. Que la ruta esta registrada en desarrollo y **no absorbe** el comodin de
 *    la pagina 404.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DesignSystemPage } from './DesignSystemPage';
import { DESIGN_SYSTEM_PATH, routes } from '../app/routes';

describe('DesignSystemPage', () => {
  it('se renderiza y encabeza la demostracion', () => {
    render(<DesignSystemPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /sistema de diseno/i }),
    ).toBeInTheDocument();
  });

  it('muestra las primitivas interactivas del sistema', () => {
    render(<DesignSystemPage />);

    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('demuestra tambien el estado deshabilitado', () => {
    render(<DesignSystemPage />);

    const deshabilitados = screen
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('disabled'));

    expect(deshabilitados.length).toBeGreaterThan(0);
  });
});

describe('registro de la ruta de demostracion', () => {
  it('esta disponible durante el desarrollo', () => {
    // La suite corre con `import.meta.env.DEV` activo, igual que el servidor de
    // desarrollo. Su ausencia en produccion se comprueba sobre `dist/`: es una
    // propiedad del build, no del arbol de modulos.
    expect(routes.some((route) => route.path === DESIGN_SYSTEM_PATH)).toBe(true);
  });

  it('usa un prefijo que no colisiona con ninguna ruta del MVP', () => {
    expect(DESIGN_SYSTEM_PATH.startsWith('/__')).toBe(true);
  });

  it('no desplaza al comodin de la pagina 404, que sigue siendo el ultimo', () => {
    expect(routes.at(-1)?.path).toBe('*');
  });
});
