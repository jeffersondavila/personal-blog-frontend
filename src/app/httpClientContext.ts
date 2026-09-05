/**
 * Cliente HTTP compartido por todo el arbol de componentes.
 *
 * La pantalla de fundacion construia el cliente en su propio `useMemo` y dejo
 * escrito por que: *«hasta que haya mas de un consumidor, un contexto adicional
 * seria una capa sin uso»*. `Task/014` trae once paginas que consumen el API,
 * asi que el contexto deja de ser especulativo.
 *
 * El valor por defecto es `null`, no un cliente inventado: usar el contexto sin
 * proveedor es un error inmediato y no una peticion silenciosa a un origen
 * equivocado (misma postura que `appConfigContext`). Y es lo que permite a las
 * pruebas inyectar un cliente con `fetch` falso sin tocar el `fetch` global.
 */
import { createContext, use } from 'react';

import type { HttpClient } from '../services/http';

export const HttpClientContext = createContext<HttpClient | null>(null);

/** Devuelve el cliente HTTP activo. */
export function useHttpClient(): HttpClient {
  const cliente = use(HttpClientContext);

  if (cliente === null) {
    throw new Error('useHttpClient se uso fuera de HttpClientContext.');
  }

  return cliente;
}
