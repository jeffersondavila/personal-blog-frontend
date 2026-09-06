/**
 * Los cuatro recursos publicables, con una sola definicion parametrizada.
 *
 * Los cuatro comparten exactamente la misma forma de contrato —listar, crear,
 * consultar, editar y transicionar— y solo difieren en **que transiciones
 * existen**: `unpublish` esta en artículos y reviews, y **no** en videos ni
 * proyectos (`api-contracts.md` seccion 14.2). Esa diferencia se expresa en el
 * tipo, no en un comentario: `RecursoDeContenido` la lleva como parametro y un
 * `despublicar` sobre un recurso que no lo admite **no compila**.
 *
 * No es una abstraccion especulativa: hay **cuatro** consumidores reales, y la
 * alternativa —cuatro modulos identicos salvo el path— seria copia literal.
 */
import type { HttpClient } from '../http';
import { listarAdmin, pedirAdmin } from './cliente';
import type { ParametrosAdmin } from './cliente';
import type { Pagina } from './types';

/** Un recurso publicable del contrato administrativo. */
export interface RecursoDeContenido<Respuesta, Cuerpo> {
  /** Segmento del path, tal como lo escribe `api-contracts.md` seccion 14.1. */
  readonly ruta: 'posts' | 'book-reviews' | 'videos' | 'projects';
  /** `true` solo en artículos y reviews (`MVP_SCOPE.md` seccion 3.2). */
  readonly admiteDespublicar: boolean;
  /** Marca de tipo; no existe en ejecucion. */
  readonly __tipos?: { readonly respuesta: Respuesta; readonly cuerpo: Cuerpo };
}

export function listar<R, C>(
  cliente: HttpClient,
  recurso: RecursoDeContenido<R, C>,
  parametros: ParametrosAdmin = {},
  signal?: AbortSignal,
): Promise<Pagina<R>> {
  return listarAdmin<R>(cliente, `/${recurso.ruta}`, parametros, signal);
}

export function obtener<R, C>(
  cliente: HttpClient,
  recurso: RecursoDeContenido<R, C>,
  id: string,
  signal?: AbortSignal,
): Promise<R> {
  return pedirAdmin<R>(
    cliente,
    `/${recurso.ruta}/${encodeURIComponent(id)}`,
    signal ? { signal } : {},
  );
}

export function crear<R, C>(
  cliente: HttpClient,
  recurso: RecursoDeContenido<R, C>,
  cuerpo: C,
  signal?: AbortSignal,
): Promise<R> {
  return pedirAdmin<R>(cliente, `/${recurso.ruta}`, {
    method: 'POST',
    body: cuerpo,
    ...(signal ? { signal } : {}),
  });
}

/**
 * Edita con `PUT`: **representacion completa** (decision **D-012-C**).
 *
 * Omitir un campo opcional lo deja nulo. No es un descuido del contrato: es lo
 * que `PUT` significa, y el formulario envia siempre el objeto entero.
 */
export function actualizar<R, C>(
  cliente: HttpClient,
  recurso: RecursoDeContenido<R, C>,
  id: string,
  cuerpo: C,
  signal?: AbortSignal,
): Promise<R> {
  return pedirAdmin<R>(cliente, `/${recurso.ruta}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: cuerpo,
    ...(signal ? { signal } : {}),
  });
}

/** Las tres transiciones son **subrecursos dedicados**, no un campo `status`. */
export type Transicion = 'publish' | 'unpublish' | 'archive';

export function transicionar<R, C>(
  cliente: HttpClient,
  recurso: RecursoDeContenido<R, C>,
  id: string,
  transicion: Transicion,
  signal?: AbortSignal,
): Promise<R> {
  return pedirAdmin<R>(cliente, `/${recurso.ruta}/${encodeURIComponent(id)}/${transicion}`, {
    method: 'POST',
    ...(signal ? { signal } : {}),
  });
}

/**
 * Transiciones que ofrece un recurso segun su estado actual.
 *
 * Se deriva del contrato y no de una tabla escrita a mano en la interfaz: si
 * `unpublish` no existe para el recurso, el boton no se dibuja porque **la ruta
 * no existe**, no porque alguien se acordara de ocultarlo.
 *
 * `archived` no ofrece ninguna: `archived → *` no existe en el contrato.
 */
export function transicionesDisponibles<R, C>(
  recurso: RecursoDeContenido<R, C>,
  estado: string,
): readonly Transicion[] {
  if (estado === 'draft') {
    return ['publish', 'archive'];
  }
  if (estado === 'published') {
    return recurso.admiteDespublicar ? ['unpublish', 'archive'] : ['archive'];
  }
  return [];
}
