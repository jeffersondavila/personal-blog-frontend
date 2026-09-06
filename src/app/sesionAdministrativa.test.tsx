/**
 * Sesion administrativa: el modelo de `Task/011`, comprobado extremo a extremo
 * sobre el router real.
 *
 * Todo lo que se afirma sale de `api-contracts.md` seccion 13 y de
 * `security-boundaries.md` seccion 11. En particular: la credencial viaja en la
 * cookie `HttpOnly` y **el frontend no la guarda en ningun sitio**.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ADMINISTRADOR,
  LOGIN,
  LOGOUT,
  ME,
  conSesion,
  renderPanel,
  sinSesion,
} from '../test/renderPanel';
import { pagina, respuestaDeError, respuestaJson, rutasPedidas } from '../test/respuestas';

const VACIO = {
  '/api/v1/admin/posts': () => respuestaJson(pagina([])),
  '/api/v1/admin/book-reviews': () => respuestaJson(pagina([])),
  '/api/v1/admin/videos': () => respuestaJson(pagina([])),
  '/api/v1/admin/projects': () => respuestaJson(pagina([])),
  '/api/v1/admin/audit-events': () => respuestaJson(pagina([])),
};

function limiteDeIntentos(cabecera: string | null = '2') {
  const respuesta = respuestaDeError('too_many_requests', 429, 'Demasiados intentos.');
  if (cabecera !== null) respuesta.headers.set('Retry-After', cabecera);
  return respuesta;
}

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Rellena el formulario de acceso y lo envia.
 *
 * `fireEvent` y no `user-event`: es lo que usa el resto de la suite y no exige
 * ninguna dependencia nueva. `act` envuelve el envio porque dispara estado
 * asincrono.
 */
async function acceder() {
  fireEvent.change(screen.getByLabelText(/Correo/), {
    target: { value: 'administrador@example.invalid' },
  });
  fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'una-contrasena' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await Promise.resolve();
  });
}

describe('sesion administrativa — arranque', () => {
  it('consulta `/me` al entrar en el panel: es la unica fuente de verdad', async () => {
    const { fetchFn } = renderPanel('/admin', { ...conSesion(), ...VACIO });

    await screen.findByRole('heading', { level: 1, name: 'Panel administrativo' });

    expect(rutasPedidas(fetchFn)).toContain(ME);
  });

  it('envia las credenciales para que la cookie `HttpOnly` viaje (D-015-C)', async () => {
    const { fetchFn } = renderPanel('/admin', { ...conSesion(), ...VACIO });

    await screen.findByRole('heading', { level: 1, name: 'Panel administrativo' });

    const llamada = fetchFn.mock.calls.find(
      ([entrada]) => typeof entrada === 'string' && entrada.includes(ME),
    );
    expect(llamada?.[1]?.credentials).toBe('include');
  });

  it('sin sesion, una ruta protegida lleva al acceso', async () => {
    renderPanel('/admin', sinSesion());

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' })).toBeVisible();
  });

  it('con sesion valida se ve el contenido protegido', async () => {
    renderPanel('/admin/etiquetas', {
      ...conSesion(),
      '/api/v1/admin/tags': () => respuestaJson(pagina([])),
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Etiquetas' })).toBeVisible();
  });
});

describe('sesion administrativa — acceso', () => {
  it('un acceso correcto entra en el panel', async () => {
    renderPanel('/admin/acceso', {
      ...sinSesion(),
      ...VACIO,
      [LOGIN]: () => respuestaJson(ADMINISTRADOR),
    });

    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    await acceder();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Panel administrativo' }),
    ).toBeVisible();
  });

  it('unas credenciales invalidas dan un mensaje generico y anunciado', async () => {
    renderPanel('/admin/acceso', {
      ...sinSesion(),
      [LOGIN]: () => respuestaDeError('invalid_credentials', 401, 'Credenciales invalidas.'),
    });

    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    await acceder();

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('Credenciales inválidas.');
    // No se revela nada del estado interno de la cuenta (seccion 13.4).
    expect(aviso).not.toHaveTextContent(/bloquead|no existe|incorrecta/i);
  });

  it('un 429 respeta Retry-After: 2 hasta los 2000 ms sin retry automatico', async () => {
    const login = vi.fn(() => limiteDeIntentos());
    renderPanel('/admin/acceso', {
      ...sinSesion(),
      [LOGIN]: login,
    });

    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    vi.useFakeTimers();
    await acceder();

    expect(screen.getByRole('alert')).toHaveTextContent(/Demasiados intentos/);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    expect(login).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1999);
    });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    expect(login).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('el handler impide un submit directo durante el cooldown', async () => {
    const login = vi.fn(() => limiteDeIntentos());
    renderPanel('/admin/acceso', { ...sinSesion(), [LOGIN]: login });
    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    vi.useFakeTimers();
    await acceder();
    const formulario = screen.getByRole('button', { name: 'Entrar' }).closest('form');
    if (formulario === null) throw new Error('Falta el formulario de acceso');

    await act(async () => {
      fireEvent.submit(formulario);
      await Promise.resolve();
    });
    expect(login).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });

  it.each([null, '0', '-2', 'invalido'])(
    'un header ausente/invalido (%j) conserva el aviso y permite otro intento manual',
    async (cabecera) => {
      const login = vi.fn(() => limiteDeIntentos(cabecera));
      renderPanel('/admin/acceso', { ...sinSesion(), [LOGIN]: login });
      await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
      vi.useFakeTimers();
      await acceder();

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Demasiados intentos. Espera antes de volver a intentarlo.',
      );
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300_000);
      });
      expect(login).toHaveBeenCalledTimes(1);
      await acceder();
      expect(login).toHaveBeenCalledTimes(2);
    },
  );

  it('un nuevo 429 tras otro intento manual establece su propia espera', async () => {
    const login = vi
      .fn()
      .mockImplementationOnce(() => limiteDeIntentos('2'))
      .mockImplementationOnce(() => limiteDeIntentos('3'));
    renderPanel('/admin/acceso', { ...sinSesion(), [LOGIN]: login });
    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    vi.useFakeTimers();
    await acceder();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    await acceder();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2999);
    });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(login).toHaveBeenCalledTimes(2);
  });

  it('desmontar el acceso elimina el timer de la espera', async () => {
    const login = vi.fn(() => limiteDeIntentos());
    const { unmount } = renderPanel('/admin/acceso', { ...sinSesion(), [LOGIN]: login });
    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    vi.useFakeTimers();
    await acceder();
    // jsdom programa selectionchange con demora 0 al rellenar el input.
    // Se despacha ese evento antes de contar el timer que pertenece al cooldown.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('un `403` de origen NO se confunde con una sesion caducada', async () => {
    renderPanel('/admin/acceso', {
      ...sinSesion(),
      [LOGIN]: () => respuestaDeError('forbidden', 403, 'Origen no permitido.'),
    });

    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    await acceder();

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent(/origen/i);
    expect(aviso).not.toHaveTextContent('Credenciales inválidas.');
  });

  it('no guarda nada en `localStorage` ni en `sessionStorage`', async () => {
    const guardar = vi.spyOn(Storage.prototype, 'setItem');
    renderPanel('/admin/acceso', {
      ...sinSesion(),
      ...VACIO,
      [LOGIN]: () => respuestaJson(ADMINISTRADOR),
    });

    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    await acceder();
    await screen.findByRole('heading', { level: 1, name: 'Panel administrativo' });

    expect(guardar).not.toHaveBeenCalled();
  });
});

describe('sesion administrativa — destino y cierre', () => {
  it.each([
    ['/admin', '/admin'],
    ['/admin/etiquetas', '/admin/etiquetas'],
    ['https://example.com/', '/admin'],
  ])('recibe state.destino=%s y tras entrar navega a %s', async (destino, esperado) => {
    const { router } = renderPanel(
      { pathname: '/admin/acceso', state: { destino } },
      {
        ...sinSesion(),
        ...VACIO,
        '/api/v1/admin/tags': () => respuestaJson(pagina([])),
        [LOGIN]: () => respuestaJson(ADMINISTRADOR),
      },
    );
    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    expect(router.state.location.state).toEqual({ destino });
    await acceder();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(esperado);
    });
  });

  it('tras entrar vuelve al destino interno solicitado', async () => {
    const { router } = renderPanel('/admin/etiquetas', {
      ...sinSesion(),
      '/api/v1/admin/tags': () => respuestaJson(pagina([])),
      [LOGIN]: () => respuestaJson(ADMINISTRADOR),
    });

    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    await acceder();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin/etiquetas');
    });
  });

  it('sin destino guardado se entra al panel', async () => {
    const { router } = renderPanel('/admin/acceso', {
      ...sinSesion(),
      ...VACIO,
      [LOGIN]: () => respuestaJson(ADMINISTRADOR),
    });

    await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' });
    await acceder();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
  });

  it('cerrar sesion con `204` deja la sesion cerrada', async () => {
    renderPanel('/admin', {
      ...conSesion(),
      ...VACIO,
      [LOGOUT]: () => new Response(null, { status: 204 }),
    });

    await screen.findByRole('heading', { level: 1, name: 'Panel administrativo' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
      await Promise.resolve();
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' })).toBeVisible();
  });

  it('cerrar sesion con `401` deja el mismo resultado observable', async () => {
    renderPanel('/admin', {
      ...conSesion(),
      ...VACIO,
      [LOGOUT]: () => respuestaDeError('unauthenticated', 401, 'Sin sesión.'),
    });

    await screen.findByRole('heading', { level: 1, name: 'Panel administrativo' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
      await Promise.resolve();
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' })).toBeVisible();
  });

  it('un `401` durante una operacion termina la sesion y lleva al acceso', async () => {
    renderPanel('/admin/etiquetas', {
      ...conSesion(),
      '/api/v1/admin/tags': () => respuestaDeError('unauthenticated', 401, 'Sin sesión.'),
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' })).toBeVisible();
  });
});
