/**
 * Consumo del endpoint de vivacidad del backend.
 *
 * Es el **primer consumo real del API** del proyecto (`Task/007`). Existe para
 * cerrar el criterio de salida de la ETAPA 02 —*el frontend consume un endpoint
 * real del backend*— con el endpoint que ya aprobo `Task/005`, sin inventar
 * ningun recurso de dominio: articulos, reviews, videos y proyectos llegan a
 * partir de `Task/009` y no se adelantan aqui.
 *
 * `GET /health` vive **fuera** del prefijo `/api/v1` a proposito: versiona el
 * contrato de datos, no la sonda de plataforma
 * (`personal-blog-infra/docs/architecture/api-contracts.md`, seccion 2). Por eso
 * `AppConfig.apiBaseUrl` es el **origen** y no la base del contrato.
 *
 * Toda la comunicacion pasa por el cliente HTTP comun
 * (`software-architecture.md`, seccion 4.3): aqui no hay ningun `fetch` suelto.
 */
import type { HttpClient } from '../http';

/** Ruta de la sonda de vivacidad del backend. */
export const RUTA_HEALTH = '/health';

/**
 * Respuesta de `GET /health`.
 *
 * Refleja el contrato que expone `app/api/health.py` en el backend. El cliente
 * HTTP no valida el tipo en ejecucion, asi que la lectura se hace de forma
 * defensiva en `esRespuestaDeSalud`.
 */
export interface BackendHealth {
  readonly status: 'ok';
  readonly service: string;
  readonly version: string;
}

/**
 * Consulta la vivacidad del backend.
 *
 * `signal` se propaga hasta `fetch` a traves del cliente HTTP: cancelar el
 * `AbortController` **aborta la peticion en vuelo**, no solo descarta su
 * resultado. Quien cancela recibe el `AbortError` tal cual, sin envolver
 * (`httpClient` distingue cancelacion de fallo de red).
 *
 * @throws {HttpError} Si el API no responde, responde con un estado no exitoso
 * o devuelve un cuerpo que no corresponde al contrato.
 * @throws {DOMException} `AbortError`, si se cancela mediante `signal`.
 */
export async function fetchBackendHealth(
  client: HttpClient,
  signal?: AbortSignal,
): Promise<BackendHealth> {
  const cuerpo = await client.request<unknown>(RUTA_HEALTH, signal ? { signal } : {});

  if (!esRespuestaDeSalud(cuerpo)) {
    // Se lanza un error normal y no un `HttpError`: la peticion fue correcta,
    // lo que no encaja es el contrato. Quien llama solo necesita saber que no
    // puede confiar en el resultado.
    throw new Error('El backend respondio a /health con un cuerpo inesperado.');
  }

  return cuerpo;
}

/**
 * Comprueba que el cuerpo recibido cumple el contrato.
 *
 * No se usa una biblioteca de validacion de esquemas: para tres campos seria
 * peso innecesario. Cuando lleguen los recursos reales (`Task/009`) se
 * reconsiderara con un consumidor que lo justifique.
 */
function esRespuestaDeSalud(valor: unknown): valor is BackendHealth {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }

  const candidato = valor as Record<string, unknown>;

  return (
    candidato['status'] === 'ok' &&
    typeof candidato['service'] === 'string' &&
    typeof candidato['version'] === 'string'
  );
}
