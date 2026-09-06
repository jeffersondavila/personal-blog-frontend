/**
 * Punto de entrada del frontend.
 *
 * Hace tres cosas, en este orden y por este motivo:
 *
 * 1. **Lee y valida la configuracion** antes que nada. Si `VITE_API_BASE_URL`
 *    o `VITE_SITE_BASE_URL` faltan o son invalidas, la aplicacion no monta y el
 *    error dice cual es la variable. Requisito T-01: configuracion por
 *    variables de entorno, validada al arrancar.
 * 2. **Construye el router de navegador** a partir de la tabla de rutas
 *    compartida con las pruebas.
 * 3. **Monta** el arbol de React sobre el contenedor de `index.html`.
 *
 * Este archivo no contiene logica propia: todo lo que decide algo vive en un
 * modulo con pruebas.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';

import { App } from './app/App';
import { routes } from './app/routes';
import { readAppConfig } from './lib/config/env';
import './styles/global.css';

const config = readAppConfig(import.meta.env);
const router = createBrowserRouter(routes);

const container = document.getElementById('root');

if (container === null) {
  throw new Error('No se encontro el elemento #root en index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App config={config} router={router} />
  </StrictMode>,
);
