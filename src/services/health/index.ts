/**
 * Superficie publica del servicio de vivacidad.
 *
 * Igual que en `services/http`: el resto de la aplicacion importa desde aqui,
 * no de los archivos internos.
 */
export { fetchBackendHealth, RUTA_HEALTH } from './healthService';
export type { BackendHealth } from './healthService';
