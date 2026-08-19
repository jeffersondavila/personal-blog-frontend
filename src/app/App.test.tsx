/**
 * Comportamiento de la fundacion: la aplicacion monta, el router resuelve la
 * ruta inicial y una ruta desconocida cae en la pagina 404.
 *
 * Se usa `createMemoryRouter` en lugar del router de navegador: la prueba no
 * depende de `window.history`, del orden de ejecucion ni de la URL con la que
 * arranque el entorno de pruebas.
 */
import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { routes } from './routes';
import type { AppConfig } from '../lib/config/env';

const CONFIG: AppConfig = { apiBaseUrl: 'http://backend.de-prueba.test' };

/** Monta la aplicacion completa en la ruta indicada. */
function renderApp(initialPath: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(<App config={CONFIG} router={router} />);
}

describe('App', () => {
  it('monta y muestra la pantalla de fundacion en la ruta inicial', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('expone la configuracion de entorno al arbol de componentes', async () => {
    renderApp('/');

    expect(await screen.findByText(CONFIG.apiBaseUrl)).toBeInTheDocument();
  });

  it('resuelve una ruta desconocida con la pagina 404 sin romper la aplicacion', async () => {
    renderApp('/una-ruta-que-no-existe');

    expect(await screen.findByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
  });

  it('mantiene una estructura navegable: la pagina 404 ofrece volver al inicio', async () => {
    renderApp('/otra-ruta-inexistente');

    expect(await screen.findByRole('link', { name: /inicio/i })).toHaveAttribute('href', '/');
  });
});
