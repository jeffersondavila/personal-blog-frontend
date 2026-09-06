/**
 * Perfil administrativo singleton (`api-contracts.md` seccion 14.1).
 *
 *     GET /api/v1/admin/profile
 *     PUT /api/v1/admin/profile
 *
 * **No se crea ni se elimina por API** (decision **D-012-U**): un `PUT` sobre un
 * perfil inexistente responde `404`, y eso no es un fallo del panel — es que
 * todavia no hay semilla (`Task/022`).
 *
 * Los enlaces sociales van como array ordenado de `{label, url}`: el orden de
 * presentacion **es el indice**, no un campo (decision **D-012-Q**).
 */
import type { HttpClient } from '../http';
import { pedirAdmin } from './cliente';
import type { PerfilAdministrativo, PerfilParaGuardar } from './types';

export function obtenerPerfil(
  cliente: HttpClient,
  signal?: AbortSignal,
): Promise<PerfilAdministrativo> {
  return pedirAdmin<PerfilAdministrativo>(cliente, '/profile', signal ? { signal } : {});
}

export function guardarPerfil(
  cliente: HttpClient,
  cuerpo: PerfilParaGuardar,
  signal?: AbortSignal,
): Promise<PerfilAdministrativo> {
  return pedirAdmin<PerfilAdministrativo>(cliente, '/profile', {
    method: 'PUT',
    body: cuerpo,
    ...(signal ? { signal } : {}),
  });
}
