/**
 * Comportamiento de la raiz: la aplicacion monta, el router resuelve la ruta
 * inicial, la configuracion de entorno llega hasta la capa que habla con el
 * API y una ruta desconocida cae en la pagina 404.
 *
 * Se usa `createMemoryRouter` en lugar del router de navegador: la prueba no
 * depende de `window.history`, del orden de ejecucion ni de la URL con la que
 * arranque el entorno de pruebas.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { routes } from './routes';
import type { AppConfig } from '../lib/config/env';
import { perfil } from '../test/fixtures';
import {
  crearFetchFalso,
  pagina,
  respuestaJson,
  urlDeLlamada,
  type FetchFalso,
} from '../test/respuestas';

const CONFIG: AppConfig = {
  apiBaseUrl: 'http://backend.de-prueba.test',
  siteBaseUrl: 'http://sitio.de-prueba.test',
};

/** Monta la aplicacion completa en la ruta indicada. */
function renderApp(initialPath: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(<App config={CONFIG} router={router} />);
}

let fetchFn: FetchFalso;

// `App` construye el cliente HTTP real a partir de la configuracion, y ese
// cliente usa el `fetch` global. La portada de `Task/014` consulta el perfil
// y los destacados al montarse; sin este doble la suite intentaria peticiones
// reales, y la regla del proyecto es que las pruebas no tocan la red.
beforeEach(() => {
  fetchFn = crearFetchFalso({
    '/api/v1/profile': () => respuestaJson(perfil()),
    '/api/v1/posts': () => respuestaJson(pagina([])),
    '/api/v1/book-reviews': () => respuestaJson(pagina([])),
    '/api/v1/videos': () => respuestaJson(pagina([])),
    '/api/v1/projects': () => respuestaJson(pagina([])),
  });
  vi.stubGlobal('fetch', fetchFn);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('monta y muestra la portada en la ruta inicial', async () => {
    renderApp('/');

    // El `h1` pasa del nombre del sitio al del autor cuando llega el perfil:
    // se espera el estado final para no quedarse con un elemento desmontado.
    expect(
      await screen.findByRole('heading', { level: 1, name: /autora del blog/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('expone la configuracion de entorno a la capa HTTP: las peticiones salen al origen configurado', async () => {
    // Antes de `Task/014` la pantalla provisional imprimia el origen en pantalla.
    // La portada real ya no lo muestra —no aporta nada al visitante—, asi que la
    // garantia se comprueba donde importa: en la URL de las peticiones.
    renderApp('/');

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalled();
    });
    fetchFn.mock.calls.forEach((_llamada, indice) => {
      expect(urlDeLlamada(fetchFn, indice).href.startsWith(`${CONFIG.apiBaseUrl}/api/v1/`)).toBe(
        true,
      );
    });
  });

  it('resuelve una ruta desconocida con la pagina 404 sin romper la aplicacion', async () => {
    renderApp('/una-ruta-que-no-existe');

    expect(await screen.findByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
  });

  it('mantiene una estructura navegable: la pagina 404 ofrece volver al inicio', async () => {
    renderApp('/otra-ruta-inexistente');

    // Desde `Task/014` la 404 se monta dentro del layout del sitio, que ya
    // tiene un enlace «Inicio» en la navegacion principal. La prueba sigue
    // comprobando lo mismo —la 404 ofrece volver al inicio— pero nombra el
    // enlace propio de la pagina para no confundirlo con el de la navegacion.
    expect(await screen.findByRole('link', { name: /volver al inicio/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
