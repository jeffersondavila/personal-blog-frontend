/**
 * Tarjeta de articulo en un listado (USER_FLOWS A.2): titulo, resumen, fecha,
 * portada y etiquetas. Semantica `li > article`; el `Card` del sistema es la
 * superficie.
 */
import { Link } from 'react-router';

import { Card } from '../../components';
import { RUTAS, rutaDeContenido } from '../../lib/rutas';
import type { PostDeListado } from '../../services/public/types';
import { PublishedDate } from '../content/PublishedDate';
import styles from '../content/tarjeta.module.css';
import { MediaImage } from '../media/MediaImage';
import { TagLinks } from '../tags/TagLinks';

export interface PostCardProps {
  readonly post: PostDeListado;
  /** Nivel del encabezado: 2 en un listado, 3 dentro de una seccion de Inicio. */
  readonly nivelDeTitulo?: 2 | 3;
}

export function PostCard({ post, nivelDeTitulo = 2 }: PostCardProps) {
  const Titulo = nivelDeTitulo === 3 ? 'h3' : 'h2';

  return (
    <li className={styles['item']}>
      <Card className={styles['tarjeta']}>
        <article className={styles['articulo']}>
          <MediaImage medio={post.cover} className={styles['imagen']} />
          <Titulo className={styles['titulo']}>
            <Link to={rutaDeContenido('post', post.slug)}>{post.title}</Link>
          </Titulo>
          <p className={styles['meta']}>
            <PublishedDate fecha={post.published_at} />
          </p>
          {post.summary !== null && <p className={styles['resumen']}>{post.summary}</p>}
          <div className={styles['pie']}>
            <TagLinks seccion={RUTAS.articulos} tags={post.tags} />
          </div>
        </article>
      </Card>
    </li>
  );
}
