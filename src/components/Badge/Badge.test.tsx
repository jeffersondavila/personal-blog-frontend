/**
 * Comportamiento de `Badge` — y, sobre todo, la garantia **A-07**.
 *
 * `Badge` es el lugar donde el sistema demuestra que *no depende del color*
 * para comunicar. Sus dos consumidores canonicos son las etiquetas publicas
 * (USER_FLOWS A.2 y A.9) y los estados de contenido del panel
 * (`MVP_SCOPE` §3.2: `draft`, `published`, `archived`).
 *
 * La garantia se construye con dos capas y se comprueba aqui:
 *
 * 1. El **texto** siempre esta presente: `children` es obligatorio por tipos.
 *    Alguien que no distinga colores lee el significado igual.
 * 2. Cada tono no neutro anade un **glifo de silueta propia**, decorativo para
 *    la tecnologia asistiva. Dos tonos nunca comparten forma, de modo que el
 *    color es la tercera senal, nunca la unica.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge, type BadgeTone } from './Badge';

const TONOS_CON_SENAL: readonly BadgeTone[] = ['success', 'warning', 'danger'];

/** Devuelve el `<svg>` decorativo del badge, si lo hay. */
function glyphOf(container: HTMLElement): SVGElement | null {
  return container.querySelector('svg');
}

describe('Badge', () => {
  it('muestra su texto', () => {
    render(<Badge>arquitectura</Badge>);

    expect(screen.getByText('arquitectura')).toBeInTheDocument();
  });

  it('renderiza un elemento en linea, apto para acompanar texto', () => {
    render(<Badge data-testid="etiqueta">arquitectura</Badge>);

    expect(screen.getByTestId('etiqueta').tagName).toBe('SPAN');
  });

  it('el tono neutro no anade ningun glifo: no hay nada que senalar', () => {
    const { container } = render(<Badge tone="neutral">arquitectura</Badge>);

    expect(glyphOf(container)).toBeNull();
  });

  it('es neutro por defecto', () => {
    const { rerender } = render(<Badge data-testid="etiqueta">tag</Badge>);
    const porDefecto = screen.getByTestId('etiqueta').className;

    rerender(
      <Badge tone="neutral" data-testid="etiqueta">
        tag
      </Badge>,
    );

    expect(screen.getByTestId('etiqueta').className).toBe(porDefecto);
  });

  it.each(TONOS_CON_SENAL)('el tono %s anade una senal no cromatica', (tone) => {
    const { container } = render(<Badge tone={tone}>estado</Badge>);

    expect(glyphOf(container)).not.toBeNull();
  });

  it.each(TONOS_CON_SENAL)('el glifo del tono %s es decorativo para lectores', (tone) => {
    const { container } = render(<Badge tone={tone}>estado</Badge>);

    expect(glyphOf(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('cada tono usa una silueta distinta: la forma tambien distingue', () => {
    const siluetas = new Set<string>();

    for (const tone of TONOS_CON_SENAL) {
      const { container, unmount } = render(<Badge tone={tone}>estado</Badge>);
      const glyph = glyphOf(container);

      expect(glyph).not.toBeNull();
      siluetas.add(glyph?.innerHTML ?? '');
      unmount();
    }

    expect(siluetas.size).toBe(TONOS_CON_SENAL.length);
  });

  it.each(TONOS_CON_SENAL)('el texto sigue siendo el portador del significado (%s)', (tone) => {
    render(<Badge tone={tone}>publicado</Badge>);

    // El glifo no ensucia el texto accesible: sigue siendo exactamente el hijo.
    expect(screen.getByText('publicado')).toBeInTheDocument();
  });

  it('aplica una clase distinta por tono', () => {
    const tonos: readonly BadgeTone[] = ['neutral', 'success', 'warning', 'danger'];
    const vistas = new Set<string>();

    for (const tone of tonos) {
      const { unmount } = render(
        <Badge tone={tone} data-testid="etiqueta">
          estado
        </Badge>,
      );
      vistas.add(screen.getByTestId('etiqueta').className);
      unmount();
    }

    expect(vistas.size).toBe(tonos.length);
  });

  it('conserva los atributos y la clase del consumidor', () => {
    render(
      <Badge id="estado-actual" className="clase-propia" data-testid="etiqueta">
        borrador
      </Badge>,
    );

    const etiqueta = screen.getByTestId('etiqueta');

    expect(etiqueta).toHaveAttribute('id', 'estado-actual');
    expect(etiqueta.className).toContain('clase-propia');
  });
});
