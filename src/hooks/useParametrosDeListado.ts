/**
 * Estado de un listado leido de la URL (decision D-014-H): `?page=` y `?tag=`.
 *
 * La URL es la fuente de verdad —una pagina o un filtro se comparten y se
 * recargan—, y esta es la unica traduccion de la URL al API. Solo pasan `page`
 * y `tag`: cualquier otro parametro presente en la direccion (una etiqueta de
 * campana, un ancla) **no se reenvia**, porque el backend rechaza con `422` lo
 * que no conoce (decision D-009-C).
 *
 * Un `page` invalido se ignora en lugar de reenviarse: el backend respondería
 * `422` y el visitante veria un error por una URL mal escrita, cuando lo util
 * es mostrarle la primera pagina.
 */
import { useSearchParams } from 'react-router';

export interface ParametrosDeListado {
  /** Pagina pedida, o `undefined` para dejar que el backend aplique la primera. */
  readonly page: number | undefined;
  readonly tag: string | undefined;
}

const PAGINA_VALIDA = /^[1-9]\d*$/;

export function leerPagina(valor: string | null): number | undefined {
  if (valor === null || !PAGINA_VALIDA.test(valor.trim())) {
    return undefined;
  }
  return Number(valor.trim());
}

export function leerEtiqueta(valor: string | null): string | undefined {
  const recortado = valor?.trim() ?? '';
  return recortado === '' ? undefined : recortado;
}

export function useParametrosDeListado(): ParametrosDeListado {
  const [parametros] = useSearchParams();
  return {
    page: leerPagina(parametros.get('page')),
    tag: leerEtiqueta(parametros.get('tag')),
  };
}
