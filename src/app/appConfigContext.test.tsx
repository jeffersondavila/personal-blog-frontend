/**
 * Guarda del contexto de configuracion.
 *
 * Se prueba porque es una decision de diseno, no un detalle: el contexto no
 * tiene un valor por defecto inventado. Si algun dia alguien monta un
 * componente fuera del proveedor, tiene que enterarse en el acto y no acabar
 * enviando peticiones a un origen equivocado.
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAppConfig } from './appConfigContext';

describe('useAppConfig', () => {
  it('falla de inmediato si se usa fuera del proveedor', () => {
    // React registra por su cuenta el error de un componente que lanza. Se
    // silencia solo durante esta prueba para que la salida de la suite no
    // parezca rota; `restoreMocks` en `vite.config.ts` deshace el espia.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useAppConfig())).toThrow(/AppConfigContext/);
  });
});
