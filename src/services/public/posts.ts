/** `GET /api/v1/posts` y `GET /api/v1/posts/{slug}` (USER_FLOWS A.2, A.3). */
import type { HttpClient } from '../http';
import { BASE_API, consultaDeListado, pedirDetalle, pedirListado } from './listado';
import type { ParametrosDeListado } from './listado';
import type { Pagina, PostDeListado, PostDetallado } from './types';

const RUTA = `${BASE_API}/posts`;

export function fetchPosts(
  client: HttpClient,
  parametros: ParametrosDeListado = {},
  signal?: AbortSignal,
): Promise<Pagina<PostDeListado>> {
  return pedirListado<PostDeListado>(client, RUTA, consultaDeListado(parametros), signal);
}

export function fetchPost(
  client: HttpClient,
  slug: string,
  signal?: AbortSignal,
): Promise<PostDetallado> {
  return pedirDetalle<PostDetallado>(client, RUTA, slug, signal);
}
