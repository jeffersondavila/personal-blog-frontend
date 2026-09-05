/**
 * Pagina 404 real del sitio publico (USER_FLOWS A.11): dice que la direccion no
 * existe y ofrece salida a Inicio y a las secciones principales.
 */
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from './NotFoundPage';
import { RUTAS, SECCIONES } from '../lib/rutas';
import { tituloDelDocumento } from '../hooks/useDocumentTitle';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('encabeza con un unico h1 que identifica el 404', () => {
    renderNotFound();

    const encabezados = screen.getAllByRole('heading', { level: 1 });
    expect(encabezados).toHaveLength(1);
    expect(encabezados[0]).toHaveTextContent(/404/);
  });

  it('enlaza a Inicio y a las seis secciones principales', () => {
    renderNotFound();

    const nav = screen.getByRole('navigation', { name: /secciones/i });
    const destinos = within(nav)
      .getAllByRole('link')
      .map((enlace) => enlace.getAttribute('href'));

    expect(destinos).toEqual([RUTAS.inicio, ...SECCIONES.map((seccion) => seccion.ruta)]);
  });

  it('fija un titulo de documento propio', () => {
    renderNotFound();

    expect(document.title).toBe(tituloDelDocumento('Página no encontrada'));
  });
});
