/**
 * Paginacion por enlaces: la pagina es estado de la URL, compartible (A.2, A.9).
 */
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Pagination } from './Pagination';

function renderPaginacion(page: number, pages: number, ruta = '/articulos') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Pagination page={page} pages={pages} />
    </MemoryRouter>,
  );
}

describe('Pagination', () => {
  it('no se renderiza cuando hay una sola pagina o ninguna', () => {
    renderPaginacion(1, 1);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    renderPaginacion(1, 0);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('es un landmark nav con nombre y marca la pagina actual con aria-current', () => {
    renderPaginacion(2, 3);

    const nav = screen.getByRole('navigation', { name: /paginaci[oó]n/i });
    const actual = within(nav).getByText('2');

    expect(actual).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: '1' })).not.toHaveAttribute('aria-current');
  });

  it('enlaza a las paginas con ?page= y a la anterior y siguiente con rel', () => {
    renderPaginacion(2, 3);

    const nav = screen.getByRole('navigation', { name: /paginaci[oó]n/i });
    const anterior = within(nav).getByRole('link', { name: /anterior/i });
    const siguiente = within(nav).getByRole('link', { name: /siguiente/i });

    expect(anterior).toHaveAttribute('href', '/articulos?page=1');
    expect(anterior).toHaveAttribute('rel', 'prev');
    expect(siguiente).toHaveAttribute('href', '/articulos?page=3');
    expect(siguiente).toHaveAttribute('rel', 'next');
    expect(within(nav).getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/articulos?page=3',
    );
  });

  it('omite anterior en la primera pagina y siguiente en la ultima', () => {
    renderPaginacion(1, 2);
    expect(screen.queryByRole('link', { name: /anterior/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('conserva el resto de parametros de la URL en cada enlace', () => {
    renderPaginacion(1, 3, '/articulos?tag=docker');

    const siguiente = screen.getByRole('link', { name: /siguiente/i });
    const url = new URL(siguiente.getAttribute('href') ?? '', 'http://sitio.test');

    expect(url.searchParams.get('tag')).toBe('docker');
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('acota las paginas visibles cuando hay muchas, conservando primera y ultima', () => {
    renderPaginacion(10, 40);

    const nav = screen.getByRole('navigation', { name: /paginaci[oó]n/i });
    const numeros = within(nav)
      .getAllByRole('listitem')
      .map((item) => item.textContent.trim());

    expect(numeros).toContain('1');
    expect(numeros).toContain('40');
    expect(numeros).toContain('10');
    expect(within(nav).getAllByRole('link').length).toBeLessThan(15);
  });
});
