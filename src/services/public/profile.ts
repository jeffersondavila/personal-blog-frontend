/**
 * `GET /api/v1/profile` (USER_FLOWS A.1, A.10; CONTENT_MODEL seccion 3.1).
 *
 * Mientras no exista la semilla local (`Task/022`) el backend responde `404`
 * (decision D-009-N). Aqui se propaga tal cual: decidir que significa es de la
 * pagina (decision D-014-K: «perfil todavia no disponible», no pagina 404).
 */
import type { HttpClient } from '../http';
import { BASE_API } from './listado';
import type { ProfilePublico } from './types';

const RUTA = `${BASE_API}/profile`;

export function fetchProfile(client: HttpClient, signal?: AbortSignal): Promise<ProfilePublico> {
  return client.request<ProfilePublico>(RUTA, signal ? { signal } : {});
}
