/**
 * Detalle de proyecto (USER_FLOWS A.7, decision D-014-A): estado del trabajo,
 * tecnologias, enlaces externos seguros y contenido Markdown.
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tituloDelDocumento } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { proyectoDetallado } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { noEncontrado, respuestaJson } from '../test/respuestas';
// El renderizador Markdown queda resuelto antes de renderizar: sin esto, la
// espera dependeria de cuanto tarde la maquina en transformar `react-markdown`.
import '../test/precargarMarkdown';

describe('ProjectDetailPage', () => {
  it('muestra el proyecto con estado, tecnologias, repositorio y contenido', async () => {
    renderRuta(`${RUTAS.proyectos}/blog-personal`, {
      '/api/v1/projects/blog-personal': () =>
        respuestaJson(proyectoDetallado({ demo_url: 'https://demo.test/' })),
    });

    const articulo = await screen.findByRole('article');
    expect(
      within(articulo).getByRole('heading', { level: 1, name: 'Blog personal' }),
    ).toBeInTheDocument();
    expect(within(articulo).getByText('Activo')).toBeInTheDocument();
    expect(within(articulo).getByRole('list', { name: /tecnolog/i })).toHaveTextContent('FastAPI');
    expect(within(articulo).getByRole('link', { name: /repositorio/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(within(articulo).getByRole('link', { name: /demo/i })).toHaveAttribute(
      'href',
      'https://demo.test/',
    );
    expect(await within(articulo).findByText('Descripcion del proyecto.')).toBeInTheDocument();
    expect(document.title).toBe(tituloDelDocumento('Blog personal'));
  });

  it('un 404 del API termina en la pagina 404', async () => {
    renderRuta(`${RUTAS.proyectos}/no-existe`, {
      '/api/v1/projects/no-existe': () => noEncontrado(),
    });

    expect(await screen.findByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
  });
});
