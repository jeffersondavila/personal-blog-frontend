/**
 * Guarda ligera de forma para la envoltura de coleccion (decision D-014-N).
 */
import { describe, expect, it } from 'vitest';

import { asegurarPagina } from './pagina';
import { HttpError } from '../http';

describe('asegurarPagina', () => {
  it('acepta la envoltura del contrato y la devuelve tipada', () => {
    const cuerpo = { items: [{ slug: 'a' }], page: 1, page_size: 12, total: 1, pages: 1 };

    expect(asegurarPagina<{ slug: string }>(cuerpo)).toBe(cuerpo);
  });

  it.each([null, 'texto', 42, [], {}, { items: [] }, { items: 'no', page: 1 }])(
    'rechaza %j como respuesta invalida',
    (cuerpo) => {
      let error: unknown;
      try {
        asegurarPagina(cuerpo);
      } catch (causa) {
        error = causa;
      }
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).kind).toBe('invalid_response');
    },
  );
});
