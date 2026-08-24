/**
 * Comportamiento de la pantalla de fundacion frente al backend real.
 *
 * La prueba sustituye `globalThis.fetch` porque es la dependencia que el
 * cliente HTTP resuelve por defecto cuando nadie le inyecta una: asi se
 * ejercita el mismo camino que recorre la aplicacion en el navegador, sin
 * tocar la red.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';
import { AppConfigContext } from '../app/appConfigContext';
import type { AppConfig } from '../lib/config/env';

const CONFIG: AppConfig = { apiBaseUrl: 'http://proxy.de-prueba.test' };

/** Monta la pantalla con la configuracion de prueba. */
function renderHomePage() {
  return render(
    <AppConfigContext value={CONFIG}>
      <HomePage />
    </AppConfigContext>,
  );
}

/** Instala un `fetch` global que devuelve la respuesta indicada. */
function stubFetch(response: Response | Promise<never>) {
  const fetchFn = vi
    .fn<typeof fetch>()
    .mockImplementation(() =>
      response instanceof Response ? Promise.resolve(response) : response,
    );
  vi.stubGlobal('fetch', fetchFn);
  return fetchFn;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomePage', () => {
  it('muestra el origen del API que recibio de la configuracion', async () => {
    stubFetch(jsonResponse({ status: 'ok', service: 'backend', version: '0.1.0' }));

    renderHomePage();

    expect(await screen.findByText(CONFIG.apiBaseUrl)).toBeInTheDocument();
  });

  it('consulta /health del backend sobre el origen configurado', async () => {
    const fetchFn = stubFetch(jsonResponse({ status: 'ok', service: 'backend', version: '0.1.0' }));

    renderHomePage();

    await screen.findByText('Backend disponible');
    expect(fetchFn.mock.calls[0]?.[0]).toBe(`${CONFIG.apiBaseUrl}/health`);
  });

  it('muestra el servicio y la version que devolvio el backend', async () => {
    stubFetch(jsonResponse({ status: 'ok', service: 'personal-blog-backend', version: '0.1.0' }));

    renderHomePage();

    expect(await screen.findByText('personal-blog-backend')).toBeInTheDocument();
    expect(screen.getByText('0.1.0')).toBeInTheDocument();
  });

  it('informa de que el backend no responde cuando la peticion falla', async () => {
    stubFetch(Promise.reject(new TypeError('failed to fetch')));

    renderHomePage();

    expect(await screen.findByText('Backend sin respuesta')).toBeInTheDocument();
  });

  it('informa de que el backend no responde ante un estado no exitoso', async () => {
    stubFetch(jsonResponse({ detail: 'caido' }, 503));

    renderHomePage();

    expect(await screen.findByText('Backend sin respuesta')).toBeInTheDocument();
  });

  it('entrega a fetch el signal del controlador que cancela al desmontar', async () => {
    const fetchFn = stubFetch(jsonResponse({ status: 'ok', service: 'backend', version: '0.1.0' }));

    const { unmount } = renderHomePage();
    await screen.findByText('Backend disponible');

    const signal = fetchFn.mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    unmount();

    // El mismo signal que recibio `fetch` queda abortado: la cancelacion llega
    // a la peticion, no se limita a descartar su resultado.
    expect(signal?.aborted).toBe(true);
  });

  it('aborta la peticion en vuelo al desmontar, sin actualizar el estado', async () => {
    // El doble de `fetch` se comporta como el real: solo rechaza cuando se
    // dispara el abort del signal que recibio.
    let abortada = false;
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            abortada = true;
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );
    vi.stubGlobal('fetch', fetchFn);

    const { unmount } = renderHomePage();
    expect(await screen.findByText('Consultando el backend...')).toBeInTheDocument();

    unmount();

    expect(abortada).toBe(true);
    // Un AbortError no debe interpretarse como backend caido.
    expect(screen.queryByText('Backend sin respuesta')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend disponible')).not.toBeInTheDocument();
  });

  it('no actualiza el estado si la respuesta llega justo despues del desmontaje', async () => {
    // Carrera que el abort no puede evitar: la promesa ya estaba resuelta
    // cuando se cancelo. La guarda de `aborted` es lo que lo cubre.
    let resolver!: (respuesta: Response) => void;
    const pendiente = new Promise<Response>((resolve) => {
      resolver = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(() => pendiente),
    );

    const { unmount } = renderHomePage();
    unmount();
    resolver(jsonResponse({ status: 'ok', service: 'backend', version: '0.1.0' }));

    await expect(pendiente).resolves.toBeInstanceOf(Response);
    expect(screen.queryByText('Backend disponible')).not.toBeInTheDocument();
  });

  it('no actualiza el estado si el fallo llega justo despues del desmontaje', async () => {
    let rechazar!: (motivo: unknown) => void;
    const pendiente = new Promise<Response>((_resolve, reject) => {
      rechazar = reject;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(() => pendiente),
    );

    const { unmount } = renderHomePage();
    unmount();
    rechazar(new TypeError('failed to fetch'));

    await expect(pendiente).rejects.toBeInstanceOf(TypeError);
    expect(screen.queryByText('Backend sin respuesta')).not.toBeInTheDocument();
  });

  it('no muestra detalles del fallo en la interfaz', async () => {
    stubFetch(jsonResponse({ detail: 'traza interna que no debe verse' }, 500));

    renderHomePage();

    await screen.findByText('Backend sin respuesta');
    expect(screen.queryByText(/traza interna/i)).not.toBeInTheDocument();
  });
});
