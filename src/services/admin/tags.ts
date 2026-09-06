/**
 * Etiquetas administrativas (`api-contracts.md` seccion 14.1).
 *
 *     GET    /api/v1/admin/tags
 *     POST   /api/v1/admin/tags
 *     PUT    /api/v1/admin/tags/{tag_id}      renombra: **sin `slug`** (D-012-S)
 *     DELETE /api/v1/admin/tags/{tag_id}      desasocia; **no** rechaza si esta en uso
 *
 * A diferencia de los medios, borrar una etiqueta en uso **no** se rechaza: se
 * desasocia del contenido y este sobrevive (`USER_FLOWS.md` B.11). La
 * confirmacion explicita que B.11 pide es un paso de **interfaz**, asignado a
 * esta tarea por la decision **D-012-T**.
 */
import type { HttpClient } from '../http';
import { listarAdmin, pedirAdmin } from './cliente';
import type { ParametrosAdmin } from './cliente';
import type {
  EtiquetaAdministrativa,
  EtiquetaParaCrear,
  EtiquetaParaRenombrar,
  Pagina,
} from './types';

export function listarEtiquetas(
  cliente: HttpClient,
  parametros: ParametrosAdmin = {},
  signal?: AbortSignal,
): Promise<Pagina<EtiquetaAdministrativa>> {
  return listarAdmin<EtiquetaAdministrativa>(cliente, '/tags', parametros, signal);
}

export function crearEtiqueta(
  cliente: HttpClient,
  cuerpo: EtiquetaParaCrear,
  signal?: AbortSignal,
): Promise<EtiquetaAdministrativa> {
  return pedirAdmin<EtiquetaAdministrativa>(cliente, '/tags', {
    method: 'POST',
    body: cuerpo,
    ...(signal ? { signal } : {}),
  });
}

export function renombrarEtiqueta(
  cliente: HttpClient,
  id: string,
  cuerpo: EtiquetaParaRenombrar,
  signal?: AbortSignal,
): Promise<EtiquetaAdministrativa> {
  return pedirAdmin<EtiquetaAdministrativa>(cliente, `/tags/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: cuerpo,
    ...(signal ? { signal } : {}),
  });
}

export function eliminarEtiqueta(
  cliente: HttpClient,
  id: string,
  signal?: AbortSignal,
): Promise<undefined> {
  return pedirAdmin(cliente, `/tags/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    ...(signal ? { signal } : {}),
  });
}
