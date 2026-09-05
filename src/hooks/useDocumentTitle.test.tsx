/**
 * Titulo del documento por pagina (WCAG 2.4.2). Es la propiedad basica de
 * accesibilidad; el SEO de `title` y `description` es de `Task/016`.
 */
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useDocumentTitle } from './useDocumentTitle';
import { NOMBRE_DEL_SITIO } from '../lib/site';

function Sonda({ titulo }: { readonly titulo: string | null | undefined }) {
  useDocumentTitle(titulo);
  return null;
}

afterEach(() => {
  document.title = '';
});

describe('useDocumentTitle', () => {
  it('fija el titulo de la pagina con el sufijo del sitio', () => {
    render(<Sonda titulo="Articulos" />);

    expect(document.title).toBe(`Articulos · ${NOMBRE_DEL_SITIO}`);
  });

  it('usa solo el nombre del sitio cuando la pagina no tiene titulo propio', () => {
    render(<Sonda titulo={null} />);

    expect(document.title).toBe(NOMBRE_DEL_SITIO);
  });

  it('actualiza el titulo cuando cambia', () => {
    const { rerender } = render(<Sonda titulo="Uno" />);
    rerender(<Sonda titulo="Dos" />);

    expect(document.title).toBe(`Dos · ${NOMBRE_DEL_SITIO}`);
  });

  it('con undefined no toca el titulo: la pagina delega en un componente hijo', () => {
    document.title = 'Fijado por otro';
    render(<Sonda titulo={undefined} />);

    expect(document.title).toBe('Fijado por otro');
  });

  it('restaura el titulo anterior al desmontar', () => {
    document.title = 'Anterior';
    const { unmount } = render(<Sonda titulo="Temporal" />);

    unmount();

    expect(document.title).toBe('Anterior');
  });
});
