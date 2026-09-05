/**
 * Guarda ligera de forma para la envoltura de coleccion (decision D-014-N).
 *
 * Misma postura que `Task/007` tomo para `/health`: sin biblioteca de
 * validacion de esquemas, se comprueba **lo minimo** que evita una excepcion
 * en el render —que `items` sea un arreglo y que los contadores sean
 * numeros—. Un cuerpo que no lo cumpla se senala como respuesta invalida, que
 * es exactamente el `kind` que el cliente HTTP ya reserva para «hubo
 * respuesta correcta, pero no era lo esperado».
 */
import { HttpError } from '../http';
import type { Pagina } from './types';

export function asegurarPagina<T>(valor: unknown): Pagina<T> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw respuestaInvalida();
  }
  const candidato = valor as Record<string, unknown>;
  if (
    !Array.isArray(candidato['items']) ||
    typeof candidato['page'] !== 'number' ||
    typeof candidato['page_size'] !== 'number' ||
    typeof candidato['total'] !== 'number' ||
    typeof candidato['pages'] !== 'number'
  ) {
    throw respuestaInvalida();
  }
  return valor as Pagina<T>;
}

function respuestaInvalida(): HttpError {
  return new HttpError('invalid_response', 'El API devolvio una coleccion con forma inesperada.');
}
