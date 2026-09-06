/**
 * Monta la aplicacion real —la misma tabla de rutas que sirve el navegador— en
 * una ruta del panel, con un `fetch` falso.
 *
 * Es el equivalente administrativo de `renderRuta`, y usa `routes` por la misma
 * razon: lo que se prueba y lo que se sirve **no pueden divergir**.
 *
 * Las rutas del panel son diferidas, asi que casi todo lo que se busque hay que
 * esperarlo con `findBy*`.
 */
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router';

import { AppConfigContext } from '../app/appConfigContext';
import { HttpClientContext } from '../app/httpClientContext';
import { routes } from '../app/routes';
import { createHttpClient } from '../services/http';
import { crearFetchFalso, respuestaDeError, respuestaJson } from './respuestas';
import type { FetchFalso, Manejador } from './respuestas';
import { CONFIG_DE_PRUEBA } from './renderRuta';

/** Identidad que devuelven `login` y `/me`. Son los tres campos del contrato. */
export const ADMINISTRADOR = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'administrador@example.invalid',
  display_name: 'Administrador de prueba',
};

export const ME = '/api/v1/admin/auth/me';
export const LOGIN = '/api/v1/admin/auth/login';
export const LOGOUT = '/api/v1/admin/auth/logout';

/** `/me` responde con sesion abierta. */
export function conSesion(): Record<string, Manejador> {
  return { [ME]: () => respuestaJson(ADMINISTRADOR) };
}

/** `/me` responde `401`: no hay sesion. */
export function sinSesion(): Record<string, Manejador> {
  return { [ME]: () => respuestaDeError('unauthenticated', 401, 'No hay sesión.') };
}

export function renderPanel(
  ruta: InitialEntry,
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
