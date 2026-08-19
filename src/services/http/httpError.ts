/**
 * Contrato de error de la capa HTTP.
 *
 * Un unico tipo de error para toda la comunicacion con el API, con un campo
 * `kind` que distingue **por que** fallo. Esa distincion importa porque la
 * respuesta razonable es distinta en cada caso: un fallo de red se reintenta o
 * se avisa como problema de conexion; un 404 es informacion legitima del
 * servidor; un cuerpo ilegible es un defecto que hay que corregir.
 *
 * El modelo comun de error del backend esta en
 * `personal-blog-infra/docs/architecture/api-contracts.md`, seccion 7:
 *
 * ```json
 * { "error": { "code": "...", "message": "...", "details": {}, "request_id": "..." } }
 * ```
 *
 * `code` es estable y legible por maquina: la capa superior puede decidir a
 * partir de el. `message` es texto para humanos y puede cambiar de redaccion,
 * asi que **nunca** debe usarse como condicion de una rama de codigo.
 */

/** Por que fallo una peticion. */
export type HttpErrorKind =
  /** No hubo respuesta: sin conexion, DNS, CORS o servidor inalcanzable. */
  | 'network'
  /** Hubo respuesta, con un codigo de estado fuera del rango 2xx. */
  | 'http'
  /** Hubo respuesta correcta, pero su cuerpo no era el JSON esperado. */
  | 'invalid_response'
  /** La peticion no llego a salir: el llamador la construyo mal. */
  | 'invalid_request';

/** Forma del cuerpo de error que produce el backend. */
interface CuerpoDeError {
  readonly code?: unknown;
  readonly message?: unknown;
  readonly details?: unknown;
  readonly request_id?: unknown;
}

/** Datos opcionales que acompanan a un error de la capa HTTP. */
export interface HttpErrorData {
  readonly status?: number | undefined;
  readonly code?: string | undefined;
  readonly details?: Readonly<Record<string, unknown>> | undefined;
  readonly requestId?: string | undefined;
  readonly cause?: unknown;
}

/**
 * Error de la capa HTTP.
 *
 * Lo que **no** transporta es tan importante como lo que transporta: nunca
 * lleva el cuerpo crudo de la respuesta ni el texto de la excepcion original
 * dentro de `message`. Un backend mal configurado puede devolver una traza en
 * el cuerpo, y ese contenido no debe acabar en la interfaz ni en un informe de
 * errores (requisito S-07 del backend, y seccion 7 de `api-contracts.md`). La
 * excepcion original sigue disponible en `cause` para depurar.
 */
export class HttpError extends Error {
  override readonly name = 'HttpError';

  /** Por que fallo la peticion. */
  readonly kind: HttpErrorKind;

  /** Codigo de estado HTTP. Ausente cuando no hubo respuesta. */
  readonly status: number | undefined;

  /** Codigo estable del backend (`resource_not_found`, `validation_error`). */
  readonly code: string | undefined;

  /** Contexto estructurado adicional; en validacion, los campos afectados. */
  readonly details: Readonly<Record<string, unknown>> | undefined;

  /** Correlation ID, para localizar la peticion en los logs del backend. */
  readonly requestId: string | undefined;

  constructor(kind: HttpErrorKind, message: string, data: HttpErrorData = {}) {
    super(message, data.cause === undefined ? undefined : { cause: data.cause });
    this.kind = kind;
    this.status = data.status;
    this.code = data.code;
    this.details = data.details;
    this.requestId = data.requestId;
  }
}

/**
 * Traduce una respuesta HTTP no exitosa al error del proyecto.
 *
 * Si el cuerpo sigue el modelo comun, se conservan `code`, `message`,
 * `details` y `request_id`. Si no lo sigue —un 502 del reverse proxy, una
 * pagina de error de la plataforma— se produce igualmente un error utilizable,
 * con un mensaje generico derivado del codigo de estado. Lo que nunca ocurre
 * es que el cuerpo desconocido se copie al mensaje.
 */
export function httpErrorFromResponse(response: Response, body: unknown): HttpError {
  const error = extraerCuerpoDeError(body);

  return new HttpError('http', leerTexto(error?.message) ?? mensajeGenerico(response), {
    status: response.status,
    code: leerTexto(error?.code),
    details: leerDetalles(error?.details),
    requestId: leerTexto(error?.request_id),
  });
}

function extraerCuerpoDeError(body: unknown): CuerpoDeError | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return undefined;
  }
  const { error } = body;
  return typeof error === 'object' && error !== null ? error : undefined;
}

function leerTexto(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : undefined;
}

function leerDetalles(valor: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : undefined;
}

function mensajeGenerico(response: Response): string {
  // Solo el estado, que el propio navegador ya conoce. El `statusText` llega
  // del servidor y por eso no se reutiliza.
  return `La peticion al API fallo con el estado HTTP ${String(response.status)}.`;
}
