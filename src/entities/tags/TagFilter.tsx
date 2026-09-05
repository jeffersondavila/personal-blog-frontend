/**
 * Filtro por etiqueta de un listado (USER_FLOWS A.9).
 *
 * Consume `GET /api/v1/tags` —que ya devuelve solo etiquetas con contenido
 * publicado (decision D-009-I)— y produce **enlaces**: el filtro es estado de
 * la URL (`?tag=`) y por tanto compartible. «Quitar filtro» tambien es un
 * enlace, no una mutacion.
 *
 * Es opcional por diseno: si el catalogo esta vacio o la peticion falla, el
 * filtro simplemente no aparece. El listado principal tiene su propio estado
 * de error; duplicarlo aqui seria ruido.
 *
 * La etiqueta activa lleva `aria-current="true"`: no es «la pagina actual»,
 * es el elemento activo de un conjunto.
 */
import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';

import styles from './TagFilter.module.css';
import { useHttpClient } from '../../app/httpClientContext';
import { Badge } from '../../components';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { rutaDeEtiqueta, type SeccionDeContenido } from '../../lib/rutas';
import { fetchTags } from '../../services/public';

export interface TagFilterProps {
  readonly seccion: SeccionDeContenido;
}

export function TagFilter({ seccion }: TagFilterProps) {
  const cliente = useHttpClient();
  const [parametros] = useSearchParams();
  const activa = parametros.get('tag');

  const cargar = useCallback((signal: AbortSignal) => fetchTags(cliente, signal), [cliente]);
  const { estado } = useAsyncResource(cargar);

  if (estado.fase !== 'exito' || estado.datos.items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Filtrar por etiqueta">
      <ul className={styles['lista']}>
        {estado.datos.items.map((tag) => {
          const esActiva = tag.slug === activa;
          return (
            <li key={tag.slug}>
              <Link
                to={rutaDeEtiqueta(seccion, tag.slug)}
                className={styles['enlace']}
                {...(esActiva ? { 'aria-current': 'true' as const } : {})}
              >
                <Badge tone={esActiva ? 'success' : 'neutral'}>{tag.name}</Badge>
              </Link>
            </li>
          );
        })}
        {activa !== null && (
          <li>
            <Link to={seccion} className={styles['quitar']}>
              Quitar filtro
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
