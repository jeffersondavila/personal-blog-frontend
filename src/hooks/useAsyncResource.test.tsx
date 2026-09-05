/**
 * Maquina de estados de un recurso asincrono: cargando, exito, error,
 * no encontrado, cancelacion al desmontar y reintento.
 */
import { act, render, screen } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAsyncResource } from './useAsyncResource';
import { HttpError } from '../services/http';

type Cargador = (signal: AbortSignal) => Promise<string>;

function Sonda({ cargar }: { readonly cargar: Cargador }) {
  const memorizado = useCallback((signal: AbortSignal) => cargar(signal), [cargar]);
  const { estado, reintentar } = useAsyncResource(memorizado);

  return (
    <div>
      <output data-testid="fase">{estado.fase}</output>
      {estado.fase === 'exito' && <output data-testid="datos">{estado.datos}</output>}
      <button type="button" onClick={reintentar}>
        reintentar
      </button>
    </div>
  );
}

describe('useAsyncResource', () => {
  it('pasa de cargando a exito con los datos', async () => {
    render(<Sonda cargar={() => Promise.resolve('hola')} />);

    expect(screen.getByTestId('fase')).toHaveTextContent('cargando');
    expect(await screen.findByTestId('datos')).toHaveTextContent('hola');
    expect(screen.getByTestId('fase')).toHaveTextContent('exito');
  });

  it('pasa a error ante un fallo generico', async () => {
    render(<Sonda cargar={() => Promise.reject(new HttpError('network', 'sin red'))} />);

    await screen.findByText('error');
  });

  it('distingue un 404 como no-encontrado', async () => {
    render(
      <Sonda
        cargar={() =>
          Promise.reject(
            new HttpError('http', 'no existe', { status: 404, code: 'resource_not_found' }),
          )
        }
      />,
    );

    await screen.findByText('no-encontrado');
  });

  it('aborta la peticion al desmontar y no actualiza el estado', () => {
    let abortado = false;
    const cargar: Cargador = (signal) =>
      new Promise((_resolver, rechazar) => {
        signal.addEventListener('abort', () => {
          abortado = true;
          rechazar(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });

    const { unmount } = render(<Sonda cargar={cargar} />);
    expect(screen.getByTestId('fase')).toHaveTextContent('cargando');

    unmount();

    expect(abortado).toBe(true);
    expect(screen.queryByText('error')).not.toBeInTheDocument();
  });

  it('no actualiza el estado si la respuesta llega justo despues del desmontaje', async () => {
    let resolver!: (valor: string) => void;
    const pendiente = new Promise<string>((resolve) => {
      resolver = resolve;
    });
    const { unmount } = render(<Sonda cargar={() => pendiente} />);

    unmount();
    resolver('tarde');

    await expect(pendiente).resolves.toBe('tarde');
    expect(screen.queryByTestId('datos')).not.toBeInTheDocument();
  });

  it('reintentar vuelve a cargando y repite la peticion', async () => {
    const cargar = vi
      .fn<Cargador>()
      .mockRejectedValueOnce(new HttpError('network', 'sin red'))
      .mockResolvedValueOnce('segundo intento');

    render(<Sonda cargar={cargar} />);
    await screen.findByText('error');

    await act(async () => {
      screen.getByRole('button', { name: 'reintentar' }).click();
      await Promise.resolve();
    });

    expect(await screen.findByTestId('datos')).toHaveTextContent('segundo intento');
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it('vuelve a cargar cuando cambia la funcion de carga', async () => {
    const { rerender } = render(<Sonda cargar={() => Promise.resolve('uno')} />);
    expect(await screen.findByTestId('datos')).toHaveTextContent('uno');

    rerender(<Sonda cargar={() => Promise.resolve('dos')} />);

    expect(await screen.findByTestId('datos')).toHaveTextContent('dos');
  });
});
