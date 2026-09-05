/**
 * Lectura del estado de un listado desde la URL: `?page=` y `?tag=`.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { useParametrosDeListado } from './useParametrosDeListado';

function Sonda() {
  const { page, tag } = useParametrosDeListado();
  return (
    <output>
      page={String(page)} tag={String(tag)}
    </output>
  );
}

function renderEn(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Sonda />
    </MemoryRouter>,
  );
}

describe('useParametrosDeListado', () => {
  it('sin parametros: pagina indefinida (la decide el backend) y sin etiqueta', () => {
    renderEn('/articulos');
    expect(screen.getByRole('status')).toHaveTextContent('page=undefined tag=undefined');
  });

  it('lee page y tag de la URL', () => {
    renderEn('/articulos?page=3&tag=docker');
    expect(screen.getByRole('status')).toHaveTextContent('page=3 tag=docker');
  });

  it.each(['0', '-1', 'abc', '1.5'])('ignora un page invalido (%s) y no lo reenvia', (valor) => {
    renderEn(`/articulos?page=${valor}`);
    expect(screen.getByRole('status')).toHaveTextContent('page=undefined');
  });

  it('ignora una etiqueta vacia y recorta espacios', () => {
    renderEn('/articulos?tag=%20%20');
    expect(screen.getByRole('status')).toHaveTextContent('tag=undefined');

    renderEn('/articulos?tag=%20react%20');
    expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('tag=react');
  });
});
