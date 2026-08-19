/**
 * Cliente HTTP comun del frontend.
 *
 * `software-architecture.md`, seccion 4.3: *solo `services` habla HTTP; ningun
 * componente hace `fetch` directamente*. Esta funcion existe para que esa regla
 * sea facil de cumplir: si el cliente resuelve la URL, las cabeceras, el JSON y
 * los errores, nadie tiene motivo para escribir un `fetch` suelto dentro de un
 * componente.
 *
 * Deliberadamente **no** implementa todavia: tokens de sesion ni refresco
 * (`Task/011`), reintentos, cache ni deduplicacion de peticiones (`Task/016`).
 * Ninguna de esas piezas puede disenarse bien sin el comportamiento que las
 * justifica, y anadirlas ahora obligaria a rehacerlas.
 *
 * Se usa `fetch` del navegador en lugar de una dependencia externa: cubre todo
 * lo que necesita el proyecto, esta disponible en todos los destinos previstos
 * y no anade peso al bundle.
 */
import { HttpError, httpErrorFromResponse } from './httpError';

/** Valores admitidos en la cadena de consulta. */
export type QueryValue = string | number | boolean | undefined;

/** Opciones de una peticion. */
export interface HttpRequestOptions {
  readonly method?: string;
  /** Parametros de consulta. Los `undefined` se omiten. */
  readonly query?: Readonly<Record<string, QueryValue>>;
  /** Cuerpo de la peticion. Se serializa como JSON. */
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  /** Permite cancelar la peticion desde la capa superior. */
  readonly signal?: AbortSignal;
}

/** Cliente HTTP hacia el API del backend. */
export interface HttpClient {
  /**
   * Ejecuta una peticion y devuelve el cuerpo ya deserializado.
   *
   * `T` describe lo que el llamador espera; el cliente no lo verifica en
   * ejecucion. La validacion de esquemas, si el proyecto la necesita, llegara
   * con los recursos reales.
   *
   * @throws {HttpError} Ante un fallo de red, una respuesta no exitosa o un
   * cuerpo que no se puede leer como JSON.
   */
  request<T = undefined>(path: string, options?: HttpRequestOptions): Promise<T>;
}

/** Dependencias del cliente HTTP. */
export interface HttpClientOptions {
  /** Origen del API, sin barra final. Procede de `AppConfig.apiBaseUrl`. */
  readonly baseUrl: string;
  /**
   * Implementacion de `fetch`. Se inyecta para que las pruebas no toquen la
   * red y para no depender de un mock global compartido entre suites.
   */
  readonly fetchFn?: typeof fetch;
}

/**
 * Estados **exitosos** que no traen cuerpo, segun la especificacion de HTTP.
 *
 * Solo se consulta despues de comprobar `response.ok`, asi que unicamente
 * puede contener codigos 2xx. El contrato del proyecto usa `204` para las
 * respuestas sin cuerpo (`api-contracts.md`, seccion 8); `205` se incluye
 * porque la especificacion tambien lo define sin cuerpo y deserializarlo
 * fallaria.
 *
 * `304 Not Modified` **no esta aqui, y es deliberado.** No es 2xx: nunca
 * llegaria a esta comprobacion porque `!response.ok` lo desvia antes hacia la
 * ruta de error. Tampoco pertenece al contrato —`api-contracts.md` no lo
 * declara y el proyecto no hace peticiones condicionales—, y el cache HTTP del
 * navegador resuelve por su cuenta un `304` de red antes de que `fetch` lo
 * entregue al codigo. Un `304` que llegue hasta aqui es una anomalia, y como
 * tal se trata: error, no exito vacio.
 */
const ESTADOS_EXITOSOS_SIN_CUERPO = new Set([204, 205]);

/** Crea un cliente HTTP apuntando al origen indicado. */
export function createHttpClient({
  baseUrl,
  fetchFn = globalThis.fetch.bind(globalThis),
}: HttpClientOptions): HttpClient {
  // Una barra final es imprescindible: `new URL('api/v1', 'http://h/backend')`
  // descarta `/backend`, mientras que con `http://h/backend/` lo conserva.
  const origen = `${baseUrl.replace(/\/+$/, '')}/`;

  return {
    async request<T = undefined>(path: string, options: HttpRequestOptions = {}): Promise<T> {
      const url = construirUrl(origen, path, options.query);
      const peticion = construirPeticion(options);

      let response: Response;
      try {
        response = await fetchFn(url, peticion);
      } catch (cause) {
        // Una cancelacion pedida por el llamador no es un fallo: se propaga
        // tal cual para que quien la pidio la reconozca.
        if (esCancelacion(cause)) {
          throw cause;
        }
        throw new HttpError('network', 'No se pudo contactar con el API.', { cause });
      }

      if (!response.ok) {
        throw httpErrorFromResponse(response, await leerJsonTolerante(response));
      }

      if (ESTADOS_EXITOSOS_SIN_CUERPO.has(response.status)) {
        return undefined as T;
      }

      return (await leerJsonEstricto(response)) as T;
    },
  };
}

/**
 * Distingue una cancelacion de un fallo de red.
 *
 * No se comprueba `cause instanceof Error`: `fetch` rechaza con un
 * `DOMException`, que segun la especificacion **no hereda de `Error`**. Esa
 * comprobacion parece correcta, compila sin quejas y clasifica todas las
 * cancelaciones como fallos de red. Lo unico fiable es el nombre.
 */
function esCancelacion(cause: unknown): boolean {
  return (
    typeof cause === 'object' && cause !== null && 'name' in cause && cause.name === 'AbortError'
  );
}

/**
 * Compone la URL final.
 *
 * Una ruta absoluta se rechaza: `request` sirve para hablar con el API
 * configurado, y aceptar `https://otro-dominio/...` convertiria un dato
 * inesperado en una peticion a un tercero.
 */
function construirUrl(
  origen: string,
  path: string,
  query: Readonly<Record<string, QueryValue>> | undefined,
): string {
  if (/^[a-z][a-z\d+\-.]*:/i.test(path) || path.startsWith('//')) {
    throw new HttpError(
      'invalid_request',
      'La ruta de la peticion debe ser relativa al API configurado.',
    );
  }

  const url = new URL(path.replace(/^\/+/, ''), origen);

  for (const [clave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined) {
      url.searchParams.set(clave, String(valor));
    }
  }

  return url.toString();
}

function construirPeticion(options: HttpRequestOptions): RequestInit {
  const headers = new Headers({ Accept: 'application/json', ...options.headers });
  const enviaCuerpo = options.body !== undefined;

  if (enviaCuerpo && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return {
    method: options.method ?? 'GET',
    headers,
    ...(enviaCuerpo ? { body: JSON.stringify(options.body) } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  };
}

/**
 * Lee el cuerpo de una respuesta de error sin dejar que su formato provoque un
 * segundo fallo: si no es JSON, el error HTTP sigue siendo lo relevante.
 */
async function leerJsonTolerante(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Lee el cuerpo de una respuesta correcta, que si debe ser JSON valido. */
async function leerJsonEstricto(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (cause) {
    throw new HttpError('invalid_response', 'El API devolvio una respuesta ilegible.', {
      status: response.status,
      cause,
    });
  }
}
