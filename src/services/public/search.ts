/**
 * `GET /api/v1/search` (USER_FLOWS A.8).
 *
 * El contrato exige `q` de 2 a 100 caracteres tras recortar espacios y
 * responde `422` si no se cumple. `normalizarTermino` es lo que permite a la
 * pagina **no llamar** cuando el termino es demasiado corto, en lugar de
 * provocar un error que despues habria que explicar al visitante.
 */
import type { HttpClient } from '../http';
import { BASE_API, pedirListado } from './listado';
import type { Pagina, ResultadoDeBusqueda } from './types';

const RUTA = `${BASE_API}/search`;

/** Minimo del contrato (ficha de `Task/009`, seccion 7.2). */
export const LONGITUD_MINIMA_DE_BUSQUEDA = 2;

/** Maximo del contrato. Por encima el backend responde `422`. */
export const LONGITUD_MAXIMA_DE_BUSQUEDA = 100;

export interface ParametrosDeBusqueda {
  readonly q: string;
  readonly page?: number | undefined;
}

/**
 * Devuelve el termino listo para enviarse, o `null` si no alcanza el minimo.
 *
 * Un termino mas largo que el maximo se recorta: el visitante sigue obteniendo
 * resultados en vez de un error de validacion por haber pegado un parrafo.
 */
export function normalizarTermino(valor: string | null | undefined): string | null {
  const recortado = (valor ?? '').trim();
  if (recortado.length < LONGITUD_MINIMA_DE_BUSQUEDA) {
    return null;
  }
  return recortado.slice(0, LONGITUD_MAXIMA_DE_BUSQUEDA);
}

export function fetchSearch(
  client: HttpClient,
  parametros: ParametrosDeBusqueda,
  signal?: AbortSignal,
): Promise<Pagina<ResultadoDeBusqueda>> {
  return pedirListado<ResultadoDeBusqueda>(
    client,
    RUTA,
    { q: parametros.q.trim(), page: parametros.page },
    signal,
  );
}
