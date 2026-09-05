/**
 * Recurso asincrono con maquina de estados explicita.
 *
 * Generaliza el patron que la pantalla de fundacion (`Task/007`) ya tenia
 * probado —`AbortController` propagado hasta `fetch`, guarda `aborted` para la
 * carrera que el abort no evita, sin detalles del fallo en la interfaz— para
 * que las once paginas del sitio publico no lo reescriban cada una.
 *
 * Cuatro fases, y no tres: un `404` del API **no es un error** del sitio. Para
 * un detalle significa «pagina 404» y para el perfil significa «todavia no hay
 * semilla» (decision D-014-K); en ambos casos la pagina necesita distinguirlo
 * de un fallo de red o del servidor, que si se muestra con «Reintentar».
 *
 * `cargar` debe ser estable entre renders (`useCallback`): es la dependencia
 * del efecto, y cambiarla vuelve a cargar. Asi el estado de la URL —pagina,
 * etiqueta, termino— se convierte en una nueva carga sin ningun mecanismo
 * adicional.
 *
 * La fase `cargando` **se deriva**, no se escribe: el resultado guardado lleva
 * la clave (`cargar`, `intento`) con la que se obtuvo, y si la clave vigente es
 * otra, el recurso esta cargando. Asi el efecto no llama a `setState` de forma
 * sincrona —lo que React desaconseja por los renders en cascada— y el cambio
 * de pagina o de filtro se refleja en el mismo render en que ocurre.
 */
import { useCallback, useEffect, useState } from 'react';

import { HttpError } from '../services/http';

export type EstadoDeRecurso<T> =
  | { readonly fase: 'cargando' }
  | { readonly fase: 'exito'; readonly datos: T }
  | { readonly fase: 'error' }
  | { readonly fase: 'no-encontrado' };

export interface RecursoAsincrono<T> {
  readonly estado: EstadoDeRecurso<T>;
  /** Vuelve a `cargando` y repite la peticion. */
  readonly reintentar: () => void;
}

export type Cargador<T> = (signal: AbortSignal) => Promise<T>;

interface Resultado<T> {
  readonly cargar: Cargador<T>;
  readonly intento: number;
  readonly estado: EstadoDeRecurso<T>;
}

const CARGANDO = { fase: 'cargando' } as const;

function esNoEncontrado(causa: unknown): boolean {
  return causa instanceof HttpError && causa.status === 404;
}

export function useAsyncResource<T>(cargar: Cargador<T>): RecursoAsincrono<T> {
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();

    void (async () => {
      try {
        const datos = await cargar(controlador.signal);
        if (!controlador.signal.aborted) {
          setResultado({ cargar, intento, estado: { fase: 'exito', datos } });
        }
      } catch (causa) {
        // Una cancelacion no es un fallo: si se aborto, no hay nada que
        // informar. El detalle del resto de fallos tampoco se expone: puede
        // arrastrar informacion interna y la pagina es publica.
        if (!controlador.signal.aborted) {
          setResultado({
            cargar,
            intento,
            estado: esNoEncontrado(causa) ? { fase: 'no-encontrado' } : { fase: 'error' },
          });
        }
      }
    })();

    return () => {
      controlador.abort();
    };
  }, [cargar, intento]);

  const reintentar = useCallback(() => {
    setIntento((valor) => valor + 1);
  }, []);

  const estado: EstadoDeRecurso<T> =
    resultado !== null && resultado.cargar === cargar && resultado.intento === intento
      ? resultado.estado
      : CARGANDO;

  return { estado, reintentar };
}
