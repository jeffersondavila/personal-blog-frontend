/**
 * Quién soy (CONTENT_MODEL 3.1): perfil con foto, titular y biografia Markdown.
 * El `404` del perfil es «todavia no disponible» (D-014-K), no pagina 404.
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tituloDelDocumento } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { perfil } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, noEncontrado, respuestaJson } from '../test/respuestas';
// El renderizador Markdown queda resuelto antes de renderizar: sin esto, la
// espera dependeria de cuanto tarde la maquina en transformar `react-markdown`.
import '../test/precargarMarkdown';

describe('AboutPage', () => {
  it('muestra nombre como h1, titular, foto con alt y biografia sanitizada', async () => {
    renderRuta(RUTAS.quienSoy, { '/api/v1/profile': () => respuestaJson(perfil()) });

    const articulo = await screen.findByRole('article');
    expect(
      within(articulo).getByRole('heading', { level: 1, name: 'Autora del Blog' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(articulo).getByText('Ingeniera de software')).toBeInTheDocument();
    expect(within(articulo).getByRole('img', { name: 'Retrato de la autora' })).toBeInTheDocument();
    expect(await within(articulo).findByText('software')).toHaveProperty('tagName', 'STRONG');
    expect(document.title).toBe(tituloDelDocumento('Quién soy'));
  });

  it('con el perfil aun sin semilla (404) explica que no esta disponible, sin pagina 404', async () => {
    renderRuta(RUTAS.quienSoy, { '/api/v1/profile': () => noEncontrado() });

    expect(await screen.findByText(/perfil a[uú]n no est[aá] disponible/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /404/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /qui[eé]n soy/i })).toBeInTheDocument();
  });

  it('ante un fallo muestra el error con reintento', async () => {
    renderRuta(RUTAS.quienSoy, { '/api/v1/profile': () => fallo() });

    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
