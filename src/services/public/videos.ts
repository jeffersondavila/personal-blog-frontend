/**
 * `GET /api/v1/videos` (USER_FLOWS A.6).
 *
 * **No existe `GET /api/v1/videos/{slug}`** en el contrato (`api-contracts.md`,
 * seccion 3; ficha de `Task/009`, criterio 2). El listado transporta ya los
 * datos de reproduccion, asi que no hay nada que un detalle pudiera anadir.
 */
import type { HttpClient } from '../http';
import { BASE_API, consultaDeListado, pedirListado } from './listado';
import type { ParametrosDeListado } from './listado';
import type { Pagina, VideoDeListado } from './types';

const RUTA = `${BASE_API}/videos`;

export function fetchVideos(
  client: HttpClient,
  parametros: ParametrosDeListado = {},
  signal?: AbortSignal,
): Promise<Pagina<VideoDeListado>> {
  return pedirListado<VideoDeListado>(client, RUTA, consultaDeListado(parametros), signal);
}
