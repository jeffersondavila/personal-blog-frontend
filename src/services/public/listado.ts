/**
 * Parametros comunes a los cuatro listados publicos (`api-contracts.md`,
 * secciones 5 y 6) y su traduccion a la cadena de consulta.
 *
 * Solo se envian los parametros que el contrato admite —`page`, `tag`,
 * `featured`, `page_size`— y solo cuando tienen valor. El backend **rechaza
 * con 422 cualquier parametro desconocido** (decision D-009-C), asi que esta
 * funcion es el unico punto por el que puede pasar una clave hacia la URL.
 *
 * `page_size` no se envia por costumbre: los listados usan el valor por
 * defecto del backend (12). Solo lo piden Inicio (destacados, 3) y el filtro
 * de etiquetas (50, el maximo).
 */
import type { HttpClient, QueryValue } from '../http';
import { asegurarPagina } from './pagina';
import type { Pagina } from './types';

export interface ParametrosDeListado {
  readonly page?: number | undefined;
  readonly tag?: string | undefined;
  readonly featured?: boolean | undefined;
  readonly pageSize?: number | undefined;
}

export function consultaDeListado(
  parametros: ParametrosDeListado,
): Readonly<Record<string, QueryValue>> {
  return {
    page: parametros.page,
    tag: parametros.tag,
    featured: parametros.featured,
    page_size: parametros.pageSize,
  };
}

/** Pide una coleccion paginada y comprueba su envoltura. */
export async function pedirListado<T>(
  client: HttpClient,
  ruta: string,
  query: Readonly<Record<string, QueryValue>>,
  signal: AbortSignal | undefined,
): Promise<Pagina<T>> {
  const cuerpo = await client.request<unknown>(ruta, signal ? { query, signal } : { query });
  return asegurarPagina<T>(cuerpo);
}

/** Pide un recurso por slug, codificado para que no pueda salir de su coleccion. */
export function pedirDetalle<T>(
  client: HttpClient,
  coleccion: string,
  slug: string,
  signal: AbortSignal | undefined,
): Promise<T> {
  const ruta = `${coleccion}/${encodeURIComponent(slug)}`;
  return client.request<T>(ruta, signal ? { signal } : {});
}

/** Base del contrato de datos. `/health` vive fuera a proposito. */
export const BASE_API = '/api/v1';
