/**
 * Base y postura comun de las peticiones administrativas.
 *
 * Un solo punto decide dos cosas que ningun adaptador debe volver a decidir:
 *
 * 1. **El prefijo.** `/api/v1/admin`, escrito una vez.
 * 2. **`credentials: 'include'`** (decision **D-015-C**). La credencial de
 *    sesion viaja **solo** en la cookie `HttpOnly` (`api-contracts.md` seccion
 *    13.3) y la topologia **D-15** pone el API en un subdominio: sin esto el
 *    navegador no la envia y ninguna ruta administrativa autentica jamas.
 *
 * El sitio publico **no pasa por aqui** y su comportamiento no cambia.
 */
import type { HttpClient, HttpRequestOptions, QueryValue } from '../http';
import { asegurarPagina } from '../public/pagina';
import type { Pagina } from './types';

/** Prefijo administrativo del contrato. */
export const BASE_ADMIN = '/api/v1/admin';

/**
 * Ejecuta una peticion administrativa.
 *
 * `credentials` se fija aqui y **no** se acepta como parametro: dejarlo abierto
 * permitiria que un adaptador futuro lo omitiera sin que nada fallara hasta
 * llegar al navegador.
 */
export function pedirAdmin<T = undefined>(
  cliente: HttpClient,
  ruta: string,
  opciones: HttpRequestOptions = {},
): Promise<T> {
  return cliente.request<T>(`${BASE_ADMIN}${ruta}`, { ...opciones, credentials: 'include' });
}

/** Parametros de paginacion admitidos por los listados administrativos. */
export interface ParametrosAdmin {
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
  /** Filtro de estado. Es el **unico** filtro del panel (decision D-012-M). */
  readonly status?: string | undefined;
}

/**
 * Traduce los parametros a la cadena de consulta.
 *
 * Solo salen `page`, `page_size` y `status`. El backend **rechaza con `422`
 * cualquier clave desconocida** (decision D-009-C, heredada por el router
 * administrativo), asi que esta funcion es el unico punto por el que un
 * parametro puede llegar a la URL.
 */
export function consultaAdmin(parametros: ParametrosAdmin): Readonly<Record<string, QueryValue>> {
  return {
    page: parametros.page,
    page_size: parametros.pageSize,
    status: parametros.status,
  };
}

/** Pide una coleccion administrativa y comprueba su envoltura. */
export async function listarAdmin<T>(
  cliente: HttpClient,
  ruta: string,
  parametros: ParametrosAdmin = {},
  signal?: AbortSignal,
): Promise<Pagina<T>> {
  const query = consultaAdmin(parametros);
  const cuerpo = await pedirAdmin<unknown>(cliente, ruta, signal ? { query, signal } : { query });
  return asegurarPagina<T>(cuerpo);
}
