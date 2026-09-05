/**
 * Monta la aplicacion publica real —tabla de rutas, layout y paginas— en una
 * ruta concreta, con un cliente HTTP cuyo `fetch` es falso.
 *
 * Es la forma en que las pruebas de pagina ejercitan lo mismo que el navegador
 * (router de datos, `Form`, `NavLink`) sin tocar la red ni el `fetch` global.
 */
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { AppConfigContext } from '../app/appConfigContext';
import { HttpClientContext } from '../app/httpClientContext';
import { routes } from '../app/routes';
import type { AppConfig } from '../lib/config/env';
import { createHttpClient } from '../services/http';
import { crearFetchFalso, type FetchFalso, type Manejador } from './respuestas';

export const CONFIG_DE_PRUEBA: AppConfig = { apiBaseUrl: 'http://api.de-prueba.test' };

export function renderRuta(
  ruta: string,
  rutasDelApi: Readonly<Record<string, Manejador>> = {},
  fetchFn: FetchFalso = crearFetchFalso(rutasDelApi),
) {
  const cliente = createHttpClient({ baseUrl: CONFIG_DE_PRUEBA.apiBaseUrl, fetchFn });
  const router = createMemoryRouter(routes, { initialEntries: [ruta] });

  const resultado = render(
    <AppConfigContext value={CONFIG_DE_PRUEBA}>
      <HttpClientContext value={cliente}>
        <RouterProvider router={router} />
      </HttpClientContext>
    </AppConfigContext>,
  );

  return { ...resultado, router, fetchFn };
}
