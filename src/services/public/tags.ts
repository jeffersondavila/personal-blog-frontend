/**
 * `GET /api/v1/tags` (USER_FLOWS A.9).
 *
 * Se pide una sola pagina con el **maximo** que admite el contrato (50,
 * decision D-009-B): el catalogo alimenta el filtro de los listados y el
 * backend ya lo acota a las etiquetas con contenido publicado (D-009-I). Si
 * algun dia hubiera mas de 50, el filtro mostraria las primeras; paginar un
 * filtro no lo pide ningun flujo.
 */
import type { HttpClient } from '../http';
import { BASE_API, pedirListado } from './listado';
import type { EtiquetaPublica, Pagina } from './types';

const RUTA = `${BASE_API}/tags`;

/** Maximo de `page_size` del contrato (`api-contracts.md`, seccion 5). */
export const PAGE_SIZE_MAXIMO = 50;

export function fetchTags(
  client: HttpClient,
  signal?: AbortSignal,
): Promise<Pagina<EtiquetaPublica>> {
  return pedirListado<EtiquetaPublica>(client, RUTA, { page_size: PAGE_SIZE_MAXIMO }, signal);
}
