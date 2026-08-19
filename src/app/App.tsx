/**
 * Raiz de la aplicacion.
 *
 * `App` no construye nada: recibe la configuracion y el router ya creados y se
 * limita a componerlos. Esa inversion es lo que permite montarla en una prueba
 * con un router en memoria y una configuracion fabricada, sin tocar
 * `window.history` ni `import.meta.env`.
 *
 * Los proveedores futuros —tema y sistema de diseno (`Task/013`), sesion
 * administrativa (`Task/015`)— se anaden aqui, envolviendo al router.
 */
import { RouterProvider } from 'react-router/dom';
import type { createBrowserRouter } from 'react-router';

import { AppConfigContext } from './appConfigContext';
import type { AppConfig } from '../lib/config/env';

/** Router construido a partir de `routes`, en memoria o de navegador. */
type AppRouter = ReturnType<typeof createBrowserRouter>;

export interface AppProps {
  readonly config: AppConfig;
  readonly router: AppRouter;
}

export function App({ config, router }: AppProps) {
  return (
    <AppConfigContext value={config}>
      <RouterProvider router={router} />
    </AppConfigContext>
  );
}
