/** `GET /api/v1/projects` y `GET /api/v1/projects/{slug}` (USER_FLOWS A.7). */
import type { HttpClient } from '../http';
import { BASE_API, consultaDeListado, pedirDetalle, pedirListado } from './listado';
import type { ParametrosDeListado } from './listado';
import type { Pagina, ProyectoDeListado, ProyectoDetallado } from './types';

const RUTA = `${BASE_API}/projects`;

export function fetchProjects(
  client: HttpClient,
  parametros: ParametrosDeListado = {},
  signal?: AbortSignal,
): Promise<Pagina<ProyectoDeListado>> {
  return pedirListado<ProyectoDeListado>(client, RUTA, consultaDeListado(parametros), signal);
}

export function fetchProject(
  client: HttpClient,
  slug: string,
  signal?: AbortSignal,
): Promise<ProyectoDetallado> {
  return pedirDetalle<ProyectoDetallado>(client, RUTA, slug, signal);
}
