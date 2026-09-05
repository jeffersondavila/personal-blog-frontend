/** `GET /api/v1/book-reviews` y `GET /api/v1/book-reviews/{slug}` (USER_FLOWS A.4, A.5). */
import type { HttpClient } from '../http';
import { BASE_API, consultaDeListado, pedirDetalle, pedirListado } from './listado';
import type { ParametrosDeListado } from './listado';
import type { Pagina, ReviewDeListado, ReviewDetallada } from './types';

const RUTA = `${BASE_API}/book-reviews`;

export function fetchBookReviews(
  client: HttpClient,
  parametros: ParametrosDeListado = {},
  signal?: AbortSignal,
): Promise<Pagina<ReviewDeListado>> {
  return pedirListado<ReviewDeListado>(client, RUTA, consultaDeListado(parametros), signal);
}

export function fetchBookReview(
  client: HttpClient,
  slug: string,
  signal?: AbortSignal,
): Promise<ReviewDetallada> {
  return pedirDetalle<ReviewDetallada>(client, RUTA, slug, signal);
}
