import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ProjectCard } from './ProjectCard';
import { RUTAS } from '../../lib/rutas';
import { proyecto } from '../../test/fixtures';

describe('ProjectCard', () => {
  it('enlaza al detalle y muestra tecnologias, estado del trabajo y enlaces externos seguros (A.7)', () => {
    render(
      <MemoryRouter>
        <ul>
          <ProjectCard proyecto={proyecto({ demo_url: 'https://demo.test/' })} />
        </ul>
      </MemoryRouter>,
    );

    const articulo = screen.getByRole('article');
    expect(within(articulo).getByRole('link', { name: 'Blog personal' })).toHaveAttribute(
      'href',
      `${RUTAS.proyectos}/blog-personal`,
    );
    expect(within(articulo).getByRole('list', { name: /tecnolog/i })).toHaveTextContent('React');
    expect(within(articulo).getByText('Activo')).toBeInTheDocument();

    const repositorio = within(articulo).getByRole('link', { name: /repositorio/i });
    expect(repositorio).toHaveAttribute('href', 'https://github.com/ejemplo/blog');
    expect(repositorio).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(articulo).getByRole('link', { name: /demo/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('omite los enlaces externos ausentes', () => {
    render(
      <MemoryRouter>
        <ul>
          <ProjectCard proyecto={proyecto({ repository_url: null, demo_url: null })} />
        </ul>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /repositorio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /demo/i })).not.toBeInTheDocument();
  });
});
