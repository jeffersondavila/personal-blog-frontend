/**
 * Paginacion por enlaces (`Task/014`).
 *
 * La pagina es **estado de la URL** (`?page=`), no estado de React: asi una
 * pagina concreta se puede compartir, recargar y volver atras, igual que el
 * filtro por etiqueta (USER_FLOWS A.9). Navegar es enlace y no boton
 * (decision D-13.5 de `Task/013`), de modo que cada pagina es un `<a>` real y
 * el lector de pantalla la anuncia como tal.
 *
 * No conoce el dominio: solo `page` y `pages`, que son la envoltura comun de
 * toda coleccion (`api-contracts.md`, seccion 5). El resto de parametros de la
 * URL —`tag`, `q`— se conservan en cada enlace.
 *
 * Con muchas paginas se muestra una ventana alrededor de la actual mas la
 * primera y la ultima: una lista de cuarenta enlaces no ayuda a nadie.
 */
import { Link, useLocation } from 'react-router';

import { HUECO, paginasVisibles } from './paginas';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** Pagina actual, empezando en 1. */
  readonly page: number;
  /** Numero total de paginas. Con 0 o 1 el componente no se renderiza. */
  readonly pages: number;
}

export function Pagination({ page, pages }: PaginationProps) {
  const { pathname, search } = useLocation();

  if (pages <= 1) {
    return null;
  }

  const hrefDe = (numero: number): string => {
    const parametros = new URLSearchParams(search);
    parametros.set('page', String(numero));
    return `${pathname}?${parametros.toString()}`;
  };

  return (
    <nav aria-label="Paginación">
      <ul className={styles['lista']}>
        {page > 1 && (
          <li>
            <Link to={hrefDe(page - 1)} rel="prev" className={styles['enlace']}>
              Anterior
            </Link>
          </li>
        )}

        {paginasVisibles(page, pages).map((elemento, indice) =>
          elemento === HUECO ? (
            <li key={`hueco-${String(indice)}`} aria-hidden="true" className={styles['hueco']}>
              {HUECO}
            </li>
          ) : (
            <li key={elemento}>
              {elemento === page ? (
                <span
                  aria-current="page"
                  className={[styles['enlace'], styles['actual']].join(' ')}
                >
                  {elemento}
                </span>
              ) : (
                <Link to={hrefDe(elemento)} className={styles['enlace']}>
                  {elemento}
                </Link>
              )}
            </li>
          ),
        )}

        {page < pages && (
          <li>
            <Link to={hrefDe(page + 1)} rel="next" className={styles['enlace']}>
              Siguiente
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
