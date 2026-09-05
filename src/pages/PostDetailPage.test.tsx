/**
 * Detalle de articulo (USER_FLOWS A.3): contenido Markdown sanitizado, `404`
 * indistinguible que termina en la pagina 404 publica, error con reintento.
 */
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tituloDelDocumento } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { postDetallado } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, noEncontrado, respuestaJson } from '../test/respuestas';
// El renderizador Markdown queda resuelto antes de renderizar: sin esto, la
// espera dependeria de cuanto tarde la maquina en transformar `react-markdown`.
import '../test/precargarMarkdown';

describe('PostDetailPage', () => {
  it('muestra el articulo completo dentro de un article con un unico h1', async () => {
    renderRuta(`${RUTAS.articulos}/hola-mundo`, {
      '/api/v1/posts/hola-mundo': () => respuestaJson(postDetallado()),
    });

    const articulo = await screen.findByRole('article');
    expect(
      within(articulo).getByRole('heading', { level: 1, name: 'Hola mundo' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(articulo).getByText('15 de agosto de 2026').tagName).toBe('TIME');
    expect(within(articulo).getByText(/3 min de lectura/)).toBeInTheDocument();
    expect(within(articulo).getByRole('img', { name: 'Portada del articulo' })).toBeInTheDocument();
    expect(within(articulo).getByRole('link', { name: 'Docker' })).toHaveAttribute(
      'href',
      `${RUTAS.articulos}?tag=docker`,
    );

    // El Markdown se renderiza sanitizado y sus encabezados bajan de nivel.
    expect(
      await within(articulo).findByRole('heading', { level: 3, name: 'Seccion' }),
    ).toBeInTheDocument();
    expect(within(articulo).getByText('articulo').tagName).toBe('STRONG');
    expect(within(articulo).getByRole('link', { name: 'un enlace' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(document.title).toBe(tituloDelDocumento('Hola mundo'));
  });

  it('un 404 del API termina en la pagina 404 publica, sin distinguir borrador de inexistente', async () => {
    renderRuta(`${RUTAS.articulos}/borrador-o-inexistente`, {
      '/api/v1/posts/borrador-o-inexistente': () => noEncontrado(),
    });

    expect(await screen.findByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toBeInTheDocument();
    expect(document.title).toBe(tituloDelDocumento('Página no encontrada'));
  });

  it('otro error muestra Reintentar y el reintento vuelve a pedir el articulo', async () => {
    let intentos = 0;
    renderRuta(`${RUTAS.articulos}/hola-mundo`, {
      '/api/v1/posts/hola-mundo': () => {
        intentos += 1;
        return intentos === 1 ? fallo() : respuestaJson(postDetallado());
      },
    });

    const alerta = await screen.findByRole('alert');
    await act(async () => {
      fireEvent.click(within(alerta).getByRole('button', { name: /reintentar/i }));
      await Promise.resolve();
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola mundo' }),
    ).toBeInTheDocument();
    expect(intentos).toBe(2);
  });
});
