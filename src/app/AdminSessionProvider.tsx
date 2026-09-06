/**
 * Proveedor de la sesion administrativa (decision **D-015-B**).
 *
 * Envuelve **solo** el subarbol `/admin`, nunca el router entero. La
 * consecuencia importa: un visitante del sitio publico **jamas** dispara
 * `GET /admin/auth/me`, asi que la existencia del panel no cambia ni una
 * peticion de la experiencia publica.
 *
 * Modelo, derivado de `Task/011` y no inventado:
 *
 * - La credencial vive **solo** en la cookie `HttpOnly` `blog_admin_session`
 *   (`api-contracts.md` seccion 13.3). El frontend **no puede leerla**, asi que
 *   no la guarda: aqui no hay `localStorage` ni `sessionStorage`, ni para la
 *   credencial ni para la identidad.
 * - Por eso la **unica** fuente de verdad es `GET /admin/auth/me`.
 * - La duracion es **absoluta**, sin renovacion deslizante. No hay temporizador
 *   que valga: la expiracion se descubre con el primer `401`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { AdminSessionContext } from './adminSessionContext';
import type { EstadoDeSesion, SesionAdministrativa } from './adminSessionContext';
import { useHttpClient } from './httpClientContext';
import { cerrarSesion, iniciarSesion, sesionActual } from '../services/admin';
import { HttpError } from '../services/http';

const DESCONOCIDA: EstadoDeSesion = { fase: 'desconocida' };
const ANONIMA: EstadoDeSesion = { fase: 'anonima' };

export interface AdminSessionProviderProps {
  readonly children: ReactNode;
}

export function AdminSessionProvider({ children }: AdminSessionProviderProps) {
  const cliente = useHttpClient();
  const [estado, setEstado] = useState<EstadoDeSesion>(DESCONOCIDA);

  useEffect(() => {
    const controlador = new AbortController();

    void (async () => {
      try {
        const administrador = await sesionActual(cliente, controlador.signal);
        if (!controlador.signal.aborted) {
          setEstado({ fase: 'autenticada', administrador });
        }
      } catch {
        /*
         * Cualquier fallo del arranque deja la sesion como `anonima`. No se
         * distingue el `401` de un fallo de red **a proposito**: para el panel
         * el resultado es el mismo —hay que volver a entrar— y el contrato
         * declara indistinguibles los cuatro casos de `unauthenticated`
         * (`api-contracts.md` seccion 13.4).
         */
        if (!controlador.signal.aborted) {
          setEstado(ANONIMA);
        }
      }
    })();

    return () => {
      controlador.abort();
    };
  }, [cliente]);

  const entrar = useCallback(
    async (email: string, password: string) => {
      /*
       * La respuesta de `login` **es** la identidad, asi que no se repite `/me`:
       * seria un viaje sin informacion nueva.
       */
      const administrador = await iniciarSesion(cliente, { email, password });
      setEstado({ fase: 'autenticada', administrador });
    },
    [cliente],
  );

  const salir = useCallback(async () => {
    try {
      await cerrarSesion(cliente);
    } catch (causa) {
      /*
       * Un `401` al cerrar sesion **no es un fallo**: significa que ya no habia
       * sesion que cerrar, y el estado final deseado es exactamente el mismo.
       * Cualquier otro error si se propaga: el administrador debe enterarse de
       * que su sesion podria seguir viva en el servidor.
       */
      if (!(causa instanceof HttpError && causa.status === 401)) {
        setEstado(ANONIMA);
        throw causa;
      }
    }
    setEstado(ANONIMA);
  }, [cliente]);

  const terminar = useCallback(() => {
    setEstado(ANONIMA);
  }, []);

  const valor = useMemo<SesionAdministrativa>(
    () => ({ estado, entrar, salir, terminar }),
    [estado, entrar, salir, terminar],
  );

  return <AdminSessionContext value={valor}>{children}</AdminSessionContext>;
}
