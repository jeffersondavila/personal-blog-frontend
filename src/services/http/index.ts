/**
 * Superficie publica de la capa HTTP.
 *
 * El resto de la aplicacion importa desde aqui —no de los archivos internos—
 * para que la organizacion interna de la carpeta pueda cambiar sin tocar a
 * todos sus consumidores.
 */
export { createHttpClient } from './httpClient';
export type { HttpClient, HttpClientOptions, HttpRequestOptions, QueryValue } from './httpClient';
export { HttpError, httpErrorFromResponse } from './httpError';
export type { HttpErrorData, HttpErrorKind } from './httpError';
