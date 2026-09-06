/**
 * Contrato del cliente HTTP comun.
 *
 * `software-architecture.md`, seccion 4.3: *solo `services` habla HTTP; ningun
 * componente hace `fetch` directamente*. Estas pruebas fijan lo que la capa
 * superior puede dar por hecho, para que ninguna Task futura tenga que
 * redescubrirlo leyendo la implementacion.
 *
 * Ninguna prueba toca la red: `fetch` se inyecta. La suite no depende de
 * Internet, del backend, ni de que haya algo escuchando en un puerto.
 */
import { describe, expect, it, vi } from 'vitest';

import { createHttpClient } from './httpClient';
import { HttpError } from './httpError';

const BASE_URL = 'http://localhost:8000';

/** Construye una respuesta JSON sin depender de la red. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Reconstruye la peticion que el cliente entrego a `fetch`. */
function capturedRequest(fetchFn: ReturnType<typeof vi.fn<typeof fetch>>): Request {
  const call = fetchFn.mock.calls[0];
  if (call === undefined) {
    throw new Error('El cliente no llamo a fetch.');
  }
  return new Request(call[0], call[1]);
}

describe('createHttpClient — construccion de la URL', () => {
  it('resuelve una ruta relativa contra el origen configurado', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ status: 'ok' }));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await client.request('/health');

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(capturedRequest(fetchFn).url).toBe('http://localhost:8000/health');
  });

  it('conserva el prefijo de ruta del origen en lugar de descartarlo', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: 'https://ejemplo.test/backend', fetchFn });

    await client.request('/api/v1/posts');

    expect(capturedRequest(fetchFn).url).toBe('https://ejemplo.test/backend/api/v1/posts');
  });

  it('serializa los parametros de consulta y omite los ausentes', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await client.request('/api/v1/posts', { query: { page: 2, tag: 'react', vacio: undefined } });

    const url = new URL(capturedRequest(fetchFn).url);
    expect(url.pathname).toBe('/api/v1/posts');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('tag')).toBe('react');
    expect(url.searchParams.has('vacio')).toBe(false);
  });

  it('rechaza una ruta absoluta para que nadie pueda saltarse el origen configurado', async () => {
    const fetchFn = vi.fn<typeof fetch>();
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await expect(client.request('https://otro-dominio.test/robar')).rejects.toBeInstanceOf(
      HttpError,
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('createHttpClient — respuesta correcta', () => {
  it('devuelve el cuerpo JSON ya deserializado', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ status: 'ok', service: 'personal-blog-backend' }));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const body = await client.request<{ status: string; service: string }>('/health');

    expect(body).toStrictEqual({ status: 'ok', service: 'personal-blog-backend' });
  });

  it('pide JSON de forma explicita', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await client.request('/health');

    expect(capturedRequest(fetchFn).headers.get('Accept')).toBe('application/json');
  });

  it('envia un cuerpo JSON y declara su tipo de contenido', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 201));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await client.request('/api/v1/ejemplo', { method: 'POST', body: { titulo: 'hola' } });

    const request = capturedRequest(fetchFn);
    expect(request.method).toBe('POST');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    await expect(request.text()).resolves.toBe('{"titulo":"hola"}');
  });

  it('devuelve undefined ante un 204 sin cuerpo, en vez de fallar al deserializar', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await expect(client.request('/api/v1/ejemplo', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('devuelve undefined ante un 205, que la especificacion tambien define sin cuerpo', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 205 }));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await expect(client.request('/api/v1/ejemplo', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('senala un cuerpo correcto pero ilegible como respuesta invalida', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('no soy json', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    );
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await expect(client.request('/health')).rejects.toMatchObject({ kind: 'invalid_response' });
  });
});

describe('createHttpClient — respuesta HTTP de error', () => {
  it('traduce el modelo comun de error del backend', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'resource_not_found',
            message: 'El articulo no existe.',
            details: { slug: 'inexistente' },
            request_id: '7f3c1a90',
          },
        },
        404,
      ),
    );
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error: unknown = await client
      .request('/api/v1/posts/inexistente')
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({
      kind: 'http',
      status: 404,
      code: 'resource_not_found',
      message: 'El articulo no existe.',
      details: { slug: 'inexistente' },
      requestId: '7f3c1a90',
    });
  });

  it('sigue produciendo un error utilizable si el cuerpo no sigue el modelo comun', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error = (await client.request('/health').catch((cause: unknown) => cause)) as HttpError;

    expect(error).toBeInstanceOf(HttpError);
    expect(error.kind).toBe('http');
    expect(error.status).toBe(502);
    expect(error.code).toBeUndefined();
    expect(error.message).not.toBe('');
  });

  it('descarta un `details` que no sea un objeto en lugar de propagarlo mal tipado', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse(
          { error: { code: 'validation_error', message: 'Datos invalidos.', details: ['campo'] } },
          422,
        ),
      );
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error = (await client.request('/api/v1/ejemplo').catch((c: unknown) => c)) as HttpError;

    expect(error.code).toBe('validation_error');
    expect(error.details).toBeUndefined();
  });

  /**
   * Regresion. El cliente evalua `!response.ok` **antes** de mirar la lista de
   * estados exitosos sin cuerpo, asi que un `304` —que no es 2xx— sale por la
   * ruta de error y jamas alcanza esa lista. Durante `Task/006` el codigo
   * llego a incluir `304` entre los estados sin cuerpo: una entrada
   * inalcanzable que describia un comportamiento que el cliente no tenia.
   *
   * `304` tampoco pertenece al contrato (`api-contracts.md`, seccion 8) y el
   * proyecto no hace peticiones condicionales. Esta prueba fija la semantica
   * elegida —anomalia, luego error— para que nadie vuelva a anadirlo a la
   * lista de exitos creyendo que asi se comporta.
   */
  it('trata un 304 como error y no como respuesta exitosa sin cuerpo', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 304 }));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error = (await client.request('/health').catch((cause: unknown) => cause)) as HttpError;

    expect(error).toBeInstanceOf(HttpError);
    expect(error.kind).toBe('http');
    expect(error.status).toBe(304);
  });

  it('no deja escapar el cuerpo crudo del servidor en el mensaje', async () => {
    const cuerpoCrudo = 'Traceback (most recent call last): File "/srv/app/main.py"';
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(cuerpoCrudo, { status: 500 }));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error = (await client.request('/health').catch((cause: unknown) => cause)) as HttpError;

    expect(error.message).not.toContain('Traceback');
    expect(error.message).not.toContain('/srv/app/main.py');
  });
});

describe('createHttpClient — Retry-After del login', () => {
  it.each(['2', '300'])('conserva Retry-After: %s desde la respuesta 429', async (cabecera) => {
    const respuesta = jsonResponse(
      {
        error: {
          code: 'too_many_requests',
          message: 'Demasiados intentos.',
          details: {},
          request_id: 'req-limite',
        },
      },
      429,
    );
    respuesta.headers.set('Retry-After', cabecera);
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(respuesta);
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await expect(
      client.request('/api/v1/admin/auth/login', { method: 'POST' }),
    ).rejects.toMatchObject({
      kind: 'http',
      status: 429,
      code: 'too_many_requests',
      message: 'Demasiados intentos.',
      details: {},
      requestId: 'req-limite',
      retryAfterSeconds: Number(cabecera),
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it.each([
    null,
    '',
    '0',
    '-2',
    '1.5',
    '2s',
    '1e2',
    '+2',
    'NaN',
    'Infinity',
    '9007199254740992',
    'Wed, 21 Oct 2015 07:28:00 GMT',
  ])('no inventa segundos para Retry-After ausente o invalido: %j', async (cabecera) => {
    const respuesta = jsonResponse({ error: { code: 'too_many_requests', details: {} } }, 429);
    if (cabecera !== null) respuesta.headers.set('Retry-After', cabecera);
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(respuesta);
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });
    const error = await client.request('/api/v1/admin/auth/login').catch((causa: unknown) => causa);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toHaveProperty('retryAfterSeconds', undefined);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('no atribuye al header un valor transportado solamente en details', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: { code: 'too_many_requests', details: { retry_after: 2 } },
        },
        429,
      ),
    );
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await expect(client.request('/api/v1/admin/auth/login')).rejects.toMatchObject({
      details: { retry_after: 2 },
      retryAfterSeconds: undefined,
    });
  });
});

describe('createHttpClient — fallo de red', () => {
  it('distingue un fallo de red de una respuesta HTTP de error', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error = (await client.request('/health').catch((cause: unknown) => cause)) as HttpError;

    expect(error).toBeInstanceOf(HttpError);
    expect(error.kind).toBe('network');
    expect(error.status).toBeUndefined();
  });

  it('conserva la causa original sin exponerla en el mensaje', async () => {
    const causa = new TypeError('Failed to fetch');
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(causa);
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error = (await client.request('/health').catch((cause: unknown) => cause)) as HttpError;

    expect(error.cause).toBe(causa);
    expect(error.message).not.toContain('Failed to fetch');
  });

  it('propaga la cancelacion sin disfrazarla de fallo de red', async () => {
    const controller = new AbortController();
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    const error = (await client
      .request('/health', { signal: controller.signal })
      .catch((cause: unknown) => cause)) as Error;

    expect(error).not.toBeInstanceOf(HttpError);
    expect(error.name).toBe('AbortError');
  });
});

/*
 * `Task/015` amplia el cliente en dos puntos, y solo dos. Ambos salen de un
 * contrato vigente, no de una comodidad:
 *
 * - **D-015-C.** La topologia logica D-15 pone el API en un subdominio, asi que
 *   la peticion administrativa es *cross-origin* y sin `credentials: 'include'`
 *   el navegador **no envia** la cookie de sesion (`api-contracts.md` seccion
 *   13.3). El sitio publico no cambia: sigue sin declarar `credentials`.
 * - **D-015-D.** `POST /admin/media` es `multipart/form-data`
 *   (`api-contracts.md` seccion 14.1). Serializar un `FormData` con
 *   `JSON.stringify` produce `"[object Object]"`, y fijar `Content-Type` a mano
 *   impide que el navegador escriba el `boundary`.
 */
describe('createHttpClient — extensiones de `Task/015`', () => {
  it('no declara credenciales cuando el llamador no las pide', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await client.request('/api/v1/posts');

    const call = fetchFn.mock.calls[0];
    expect(call?.[1]).not.toHaveProperty('credentials');
  });

  it('propaga las credenciales que pide el llamador (D-015-C)', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await client.request('/api/v1/admin/auth/me', { credentials: 'include' });

    expect(fetchFn.mock.calls[0]?.[1]?.credentials).toBe('include');
  });

  it('envia un FormData tal cual, sin serializarlo a JSON (D-015-D)', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });
    const cuerpo = new FormData();
    cuerpo.append('archivo', new Blob(['bytes']), 'imagen.png');

    await client.request('/api/v1/admin/media', { method: 'POST', body: cuerpo });

    expect(fetchFn.mock.calls[0]?.[1]?.body).toBe(cuerpo);
  });

  it('deja que el navegador fije el `Content-Type` del multipart (D-015-D)', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: BASE_URL, fetchFn });

    await client.request('/api/v1/admin/media', { method: 'POST', body: new FormData() });

    const headers = new Headers(fetchFn.mock.calls[0]?.[1]?.headers);
    expect(headers.has('Content-Type')).toBe(false);
  });
});
