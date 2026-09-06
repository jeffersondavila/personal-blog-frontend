/**
 * Los tres endpoints de autenticacion administrativa (`api-contracts.md` 13.1).
 *
 *     POST /api/v1/admin/auth/login     unico endpoint administrativo publico
 *     GET  /api/v1/admin/auth/me        fuente de verdad de la sesion
 *     POST /api/v1/admin/auth/logout    invalida en el servidor
 *
 * **La credencial no aparece en ningun cuerpo** y este modulo no la toca: viaja
 * en la cookie `HttpOnly` `blog_admin_session`, que el navegador gestiona solo.
 * No hay token que guardar, y por eso aqui no hay `localStorage` ni
 * `sessionStorage` — ni puede haberlos: `HttpOnly` significa que JavaScript no
 * la lee.
 */
import type { HttpClient } from '../http';
import { pedirAdmin } from './cliente';
import type { AdministradorAutenticado } from './types';

/** Credenciales de acceso. `password` nunca se registra ni se guarda. */
export interface Credenciales {
  readonly email: string;
  readonly password: string;
}

/**
 * Inicia sesion.
 *
 * La respuesta **es** la identidad del administrador, asi que no hace falta
 * volver a pedir `/me` despues: seria un viaje sin informacion nueva.
 */
export function iniciarSesion(
  cliente: HttpClient,
  credenciales: Credenciales,
  signal?: AbortSignal,
): Promise<AdministradorAutenticado> {
  return pedirAdmin<AdministradorAutenticado>(cliente, '/auth/login', {
    method: 'POST',
    body: credenciales,
    ...(signal ? { signal } : {}),
  });
}

/**
 * Consulta la sesion en curso.
 *
 * Es la **unica** forma de saber si hay sesion: la cookie es `HttpOnly` y el
 * frontend no puede leerla.
 */
export function sesionActual(
  cliente: HttpClient,
  signal?: AbortSignal,
): Promise<AdministradorAutenticado> {
  return pedirAdmin<AdministradorAutenticado>(cliente, '/auth/me', signal ? { signal } : {});
}

/** Cierra la sesion. Responde `204` sin cuerpo. */
export function cerrarSesion(cliente: HttpClient, signal?: AbortSignal): Promise<undefined> {
  return pedirAdmin(cliente, '/auth/logout', {
    method: 'POST',
    ...(signal ? { signal } : {}),
  });
}
