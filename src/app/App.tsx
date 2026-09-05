/**
 * Raiz de la aplicacion.
 *
 * `App` no construye el router ni lee el entorno: recibe la configuracion y el
 * router ya creados y se limita a componerlos. Esa inversion es lo que permite
 * montarla en una prueba con un router en memoria y una configuracion
 * fabricada, sin tocar `window.history` ni `import.meta.env`.
 *
 * Lo unico que construye es el **cliente HTTP compartido** (`Task/014`), a
 * partir del origen configurado, y lo expone por contexto a las paginas. Se
 * memoriza por origen: cambiar la configuracion —que no ocurre en ejecucion—
 * seria lo unico que justificaria un cliente nuevo.
 *
 * El proveedor de sesion administrativa (`Task/015`) se anadira aqui,
 * envolviendo al router.
 */
import { useMemo } from 'react';
import { RouterProvider } from 'react-router/dom';
import type { createBrowserRouter } from 'react-router';

import { AppConfigContext } from './appConfigContext';
import { HttpClientContext } from './httpClientContext';
import type { AppConfig } from '../lib/config/env';
import { createHttpClient } from '../services/http';

/** Router construido a partir de `routes`, en memoria o de navegador. */
type AppRouter = ReturnType<typeof createBrowserRouter>;

export interface AppProps {
  readonly config: AppConfig;
  readonly router: AppRouter;
}

export function App({ config, router }: AppProps) {
  const httpClient = useMemo(
    () => createHttpClient({ baseUrl: config.apiBaseUrl }),
    [config.apiBaseUrl],
  );

  return (
    <AppConfigContext value={config}>
      <HttpClientContext value={httpClient}>
        <RouterProvider router={router} />
      </HttpClientContext>
    </AppConfigContext>
  );
}
