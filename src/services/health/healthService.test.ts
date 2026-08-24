/**
 * Comportamiento del consumo de `GET /health`.
 *
 * Las pruebas inyectan un `fetch` fabricado en el cliente HTTP oficial en lugar
 * de sustituir el cliente entero: asi se ejercita tambien la composicion real
 * de la URL a partir del origen configurado, que es justo lo que cambia al
 * pasar por el reverse proxy local.
 */
import { describe, expect, it, vi } from 'vitest';

import { fetchBackendHealth, RUTA_HEALTH } from './healthService';
import { createHttpClient, HttpError } from '../http';

const ORIGEN = 'http://proxy.de-prueba.test';

/** Crea un cliente HTTP cuyo `fetch` devuelve la respuesta indicada. */
function clienteQueResponde(response: Response) {
  const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(response);
  return { cliente: createHttpClient({ baseUrl: ORIGEN, fetchFn }), fetchFn };
}

/** Respuesta JSON con el estado indicado. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchBackendHealth', () => {
  it('devuelve el estado del backend cuando la respuesta cumple el contrato', async () => {
    const { cliente } = clienteQueResponde(
      jsonResponse({ status: 'ok', service: 'personal-blog-backend', version: '0.1.0' }),
    );

    await expect(fetchBackendHealth(cliente)).resolves.toEqual({
      status: 'ok',
      service: 'personal-blog-backend',
      version: '0.1.0',
    });
  });

  it('consulta /health sobre el origen configurado, fuera del prefijo /api/v1', async () => {
    const { cliente, fetchFn } = clienteQueResponde(
      jsonResponse({ status: 'ok', service: 'backend', version: '0.1.0' }),
    );

    await fetchBackendHealth(cliente);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0]?.[0]).toBe(`${ORIGEN}${RUTA_HEALTH}`);
  });

  it('propaga un HttpError cuando el backend responde con un estado no exitoso', async () => {
    const { cliente } = clienteQueResponde(jsonResponse({ detail: 'caido' }, 503));

    await expect(fetchBackendHealth(cliente)).rejects.toBeInstanceOf(HttpError);
  });

  it('propaga un HttpError cuando no se puede contactar con el API', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('failed to fetch'));
    const cliente = createHttpClient({ baseUrl: ORIGEN, fetchFn });

    await expect(fetchBackendHealth(cliente)).rejects.toMatchObject({ kind: 'network' });
  });

  it('rechaza un cuerpo que no corresponde al contrato de /health', async () => {
    const { cliente } = clienteQueResponde(jsonResponse({ status: 'degradado' }));

    await expect(fetchBackendHealth(cliente)).rejects.toThrow(/cuerpo inesperado/i);
  });

  it('rechaza un cuerpo que no es un objeto', async () => {
    const { cliente } = clienteQueResponde(jsonResponse('ok'));

    await expect(fetchBackendHealth(cliente)).rejects.toThrow(/cuerpo inesperado/i);
  });

  it('propaga el signal hasta fetch, para que la peticion sea cancelable', async () => {
    const { cliente, fetchFn } = clienteQueResponde(
      jsonResponse({ status: 'ok', service: 'backend', version: '0.1.0' }),
    );
    const controlador = new AbortController();

    await fetchBackendHealth(cliente, controlador.signal);

    // Lo que importa no es que se pase "un" signal, sino que sea EXACTAMENTE el
    // del controlador: es lo unico que hace que `abort()` afecte a esta peticion.
    expect(fetchFn.mock.calls[0]?.[1]?.signal).toBe(controlador.signal);
  });

  it('no envia signal cuando el llamador no aporta ninguno', async () => {
    const { cliente, fetchFn } = clienteQueResponde(
      jsonResponse({ status: 'ok', service: 'backend', version: '0.1.0' }),
    );

    await fetchBackendHealth(cliente);

    expect(fetchFn.mock.calls[0]?.[1]?.signal).toBeUndefined();
  });

  it('propaga el AbortError sin envolverlo cuando se cancela la peticion', async () => {
    // `fetch` real rechaza con un DOMException 'AbortError' al cancelar. El
    // cliente HTTP debe dejarlo pasar tal cual, no convertirlo en un fallo de
    // red: quien cancelo necesita reconocer su propia cancelacion.
    const controlador = new AbortController();
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );
    const cliente = createHttpClient({ baseUrl: ORIGEN, fetchFn });

    const promesa = fetchBackendHealth(cliente, controlador.signal);
    controlador.abort();

    await expect(promesa).rejects.toMatchObject({ name: 'AbortError' });
    await expect(promesa).rejects.not.toBeInstanceOf(HttpError);
  });
});
