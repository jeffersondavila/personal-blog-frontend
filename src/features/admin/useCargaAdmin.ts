/**
 * Carga de datos del panel, con la unica diferencia que el panel necesita
 * respecto del sitio publico: **un `401` termina la sesion**.
 *
 * Se apoya en `useAsyncResource` de `Task/014` en lugar de reimplementarlo: la
 * maquina de estados, el `AbortController` y la guarda de carrera ya estan
 * probados alli. Lo unico que se anade es el efecto sobre la sesion, y por eso
 * este modulo es tan corto.
 *
 * Terminar la sesion basta para salir del panel: `RutaProtegida` observa el
 * estado y navega al acceso conservando el destino. No hace falta —ni conviene—
 * que cada pagina sepa redirigir por su cuenta.
 */
import { useCallback } from 'react';

import { esSesionCaducada } from './errores';
import { useAdminSession } from '../../app/adminSessionContext';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import type { Cargador, RecursoAsincrono } from '../../hooks/useAsyncResource';

export function useCargaAdmin<T>(cargar: Cargador<T>): RecursoAsincrono<T> {
  const { terminar } = useAdminSession();

  const envuelto = useCallback<Cargador<T>>(
    async (signal) => {
      try {
        return await cargar(signal);
      } catch (causa) {
        if (esSesionCaducada(causa)) {
          terminar();
        }
        throw causa;
      }
    },
    [cargar, terminar],
  );

  return useAsyncResource(envuelto);
}

/** Firma de la envoltura de escritura. */
export type EscrituraAdmin = <T>(operacion: () => Promise<T>) => Promise<T>;

/**
 * Envuelve una **escritura** para que un `401` tambien termine la sesion.
 *
 * Las escrituras no pasan por `useAsyncResource` —tienen su propio estado de
 * envio dentro del formulario—, asi que necesitan el mismo cuidado por su
 * cuenta. El error se **vuelve a lanzar** siempre: quien envio el formulario
 * tiene que poder mostrarlo.
 */
export function useEscrituraAdmin(): EscrituraAdmin {
  const { terminar } = useAdminSession();

  return useCallback<EscrituraAdmin>(
    async (operacion) => {
      try {
        return await operacion();
      } catch (causa) {
        if (esSesionCaducada(causa)) {
          terminar();
        }
        throw causa;
      }
    },
    [terminar],
  );
}
