/**
 * Utilidades comunes para las pruebas que simulan el API publico.
 *
 * Ninguna prueba toca la red: el `fetch` se inyecta en el cliente HTTP y aqui
 * solo se fabrican respuestas con la forma exacta del contrato
 * (`api-contracts.md`, secciones 5 y 7).
 */
import { vi } from 'vitest';

import type { Pagina } from '../services/public/types';

/** Respuesta JSON con el codigo indicado. */
export function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Envoltura de coleccion tal como la emite el backend. */
export function pagina<T>(items: readonly T[], extra: Partial<Pagina<T>> = {}): Pagina<T> {
  const pageSize = extra.page_size ?? 12;
  const total = extra.total ?? items.length;
  return {
    items: [...items],
    page: extra.page ?? 1,
    page_size: pageSize,
    total,
    pages: extra.pages ?? Math.ceil(total / pageSize),
  };
}

/** Cuerpo de error del contrato comun (`api-contracts.md`, seccion 7). */
export function respuestaDeError(code: string, status: number, message = 'Error'): Response {
  return respuestaJson(
    { error: { code, message, details: {}, request_id: 'req-de-prueba' } },
    status,
  );
}

/** El `404` publico: identico para inexistente, borrador y archivado. */
export function noEncontrado(): Response {
  return respuestaDeError('resource_not_found', 404, 'El recurso solicitado no existe.');
}

/** Un fallo del servidor con un cuerpo que no debe llegar a la interfaz. */
export function fallo(): Response {
  return respuestaJson({ detail: 'traza interna que no debe verse' }, 500);
}

export type Manejador = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>;

function urlDe(entrada: string | URL | Request): URL {
  if (typeof entrada === 'string') {
    return new URL(entrada);
  }
  if (entrada instanceof URL) {
    return entrada;
  }
  return new URL(entrada.url);
}

/**
 * Crea un `fetch` falso que enruta por `pathname`.
 *
 * Una ruta no registrada responde con el `404` del contrato, de modo que una
 * peticion no prevista se nota en la prueba en lugar de colgarla. Cada llamada
 * construye una `Response` nueva: un cuerpo ya leido no puede releerse.
 */
export function crearFetchFalso(rutas: Readonly<Record<string, Manejador>>) {
  return vi.fn<typeof fetch>().mockImplementation((entrada, init) => {
    const url = urlDe(entrada);
    const manejador = rutas[url.pathname];
    if (manejador === undefined) {
      return Promise.resolve(noEncontrado());
    }
    return Promise.resolve(manejador(url, init));
  });
}

export type FetchFalso = ReturnType<typeof crearFetchFalso>;

/** URL de la llamada numero `indice` registrada por un `fetch` falso. */
export function urlDeLlamada(fetchFn: FetchFalso, indice = 0): URL {
  const llamada = fetchFn.mock.calls[indice];
  if (llamada === undefined) {
    throw new Error(`No hubo llamada numero ${String(indice)} a fetch.`);
  }
  return urlDe(llamada[0]);
}

/** Todas las rutas (pathname + search) pedidas, en orden. */
export function rutasPedidas(fetchFn: FetchFalso): string[] {
  return fetchFn.mock.calls.map(([entrada]) => {
    const url = urlDe(entrada);
    return `${url.pathname}${url.search}`;
  });
}
