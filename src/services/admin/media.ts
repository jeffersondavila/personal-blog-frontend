/**
 * Biblioteca de medios (`api-contracts.md` seccion 14.1, flujos B.4 y B.5).
 *
 *     GET    /api/v1/admin/media
 *     POST   /api/v1/admin/media          multipart: `archivo` + `alt_text` opcional
 *     DELETE /api/v1/admin/media/{id}     `409 media_in_use` si esta referenciada
 *
 * **Render frente a escritura**, que es la distincion que mas facil se
 * confunde:
 *
 * - Para **mostrar** una imagen se usa `access_url`, un enlace **temporal** que
 *   el backend firma al servir. No se almacena, no se persiste y no se
 *   construye ninguna URL de MinIO o S3.
 * - Para **asociar** una imagen a un contenido se usa su `id`. La regla publica
 *   *"solo `access_url`"* es de lectura; la escritura administrativa usa el
 *   identificador (`api-contracts.md` seccion 14.3).
 *
 * `object_key` **no existe en el contrato** y no aparece por ninguna parte.
 */
import type { HttpClient } from '../http';
import { listarAdmin, pedirAdmin } from './cliente';
import type { ParametrosAdmin } from './cliente';
import type { MedioAdministrativo, Pagina } from './types';

/** Limites que el backend impone y el panel se limita a anunciar (`Task/010`). */
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
export const TIPOS_ADMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function listarMedios(
  cliente: HttpClient,
  parametros: ParametrosAdmin = {},
  signal?: AbortSignal,
): Promise<Pagina<MedioAdministrativo>> {
  return listarAdmin<MedioAdministrativo>(cliente, '/media', parametros, signal);
}

/**
 * Carga una imagen.
 *
 * El cuerpo es un `FormData` **de verdad**: el cliente lo entrega sin tocarlo y
 * sin fijar `Content-Type`, para que el navegador escriba el `boundary`
 * (decision **D-015-D**).
 *
 * `alt_text` es **opcional al cargar** (decision **D-010-N**): se escribe al
 * *usar* la imagen, no al subirla, y exigirlo aqui obligaria a anticipar un
 * texto sin saber todavia en que contenido va a aparecer.
 */
export function cargarMedio(
  cliente: HttpClient,
  archivo: File,
  altText?: string,
  signal?: AbortSignal,
): Promise<MedioAdministrativo> {
  const cuerpo = new FormData();
  cuerpo.append('archivo', archivo);
  if (altText !== undefined && altText.trim() !== '') {
    cuerpo.append('alt_text', altText.trim());
  }
  return pedirAdmin<MedioAdministrativo>(cliente, '/media', {
    method: 'POST',
    body: cuerpo,
    ...(signal ? { signal } : {}),
  });
}

export function eliminarMedio(
  cliente: HttpClient,
  id: string,
  signal?: AbortSignal,
): Promise<undefined> {
  return pedirAdmin(cliente, `/media/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    ...(signal ? { signal } : {}),
  });
}
