/**
 * Ventana de paginas visibles de `Pagination`. Logica pura, separada del
 * componente para que el archivo del componente exporte solo componentes.
 */

/** Marcador de hueco entre dos numeros de pagina no consecutivos. */
export const HUECO = '…';

/** Paginas visibles: todas si son pocas; si no, extremos y una ventana alrededor de la actual. */
export function paginasVisibles(page: number, pages: number): readonly (number | typeof HUECO)[] {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_valor, indice) => indice + 1);
  }

  const candidatas = new Set<number>([1, pages, page - 1, page, page + 1]);
  const ordenadas = [...candidatas].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  const resultado: (number | typeof HUECO)[] = [];
  let anterior = 0;
  for (const numero of ordenadas) {
    if (numero - anterior > 1) {
      resultado.push(HUECO);
    }
    resultado.push(numero);
    anterior = numero;
  }
  return resultado;
}
