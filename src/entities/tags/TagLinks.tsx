/**
 * Etiquetas de un contenido, como enlaces al listado filtrado de **su** tipo
 * (USER_FLOWS A.9: «el visitante selecciona una etiqueta desde un contenido»).
 *
 * El filtro `tag` es por tipo —`/articulos?tag=x` no muestra reviews—, asi que
 * la seccion la decide quien renderiza. Cada etiqueta es un `Badge` neutro
 * dentro de un enlace real.
 */
import { Link } from 'react-router';

import styles from './TagLinks.module.css';
import { Badge } from '../../components';
import { rutaDeEtiqueta, type SeccionDeContenido } from '../../lib/rutas';
import type { EtiquetaPublica } from '../../services/public/types';

export interface TagLinksProps {
  readonly seccion: SeccionDeContenido;
  readonly tags: readonly EtiquetaPublica[];
}

export function TagLinks({ seccion, tags }: TagLinksProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul className={styles['lista']} aria-label="Etiquetas">
      {tags.map((tag) => (
        <li key={tag.slug}>
          <Link to={rutaDeEtiqueta(seccion, tag.slug)} className={styles['enlace']}>
            <Badge>{tag.name}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
