/**
 * Tarjeta de review en un listado (USER_FLOWS A.4): lo de un articulo mas el
 * libro, su autor y la valoracion.
 */
import { Link } from 'react-router';

import { describirLibro } from './libro';
import { Rating } from './Rating';
import { Card } from '../../components';
import { RUTAS, rutaDeContenido } from '../../lib/rutas';
import type { ReviewDeListado } from '../../services/public/types';
import { PublishedDate } from '../content/PublishedDate';
import styles from '../content/tarjeta.module.css';
import { MediaImage } from '../media/MediaImage';
import { TagLinks } from '../tags/TagLinks';

export interface ReviewCardProps {
  readonly review: ReviewDeListado;
  readonly nivelDeTitulo?: 2 | 3;
}

export function ReviewCard({ review, nivelDeTitulo = 2 }: ReviewCardProps) {
  const Titulo = nivelDeTitulo === 3 ? 'h3' : 'h2';
  const libro = describirLibro(review);

  return (
    <li className={styles['item']}>
      <Card className={styles['tarjeta']}>
        <article className={styles['articulo']}>
          <MediaImage medio={review.cover} className={styles['imagen']} />
          <Titulo className={styles['titulo']}>
            <Link to={rutaDeContenido('book_review', review.slug)}>{review.title}</Link>
          </Titulo>
          {libro !== null && <p className={styles['meta']}>{libro}</p>}
          <p className={styles['meta']}>
            <PublishedDate fecha={review.published_at} />
          </p>
          <Rating rating={review.rating} />
          {review.summary !== null && <p className={styles['resumen']}>{review.summary}</p>}
          <div className={styles['pie']}>
            <TagLinks seccion={RUTAS.reviews} tags={review.tags} />
          </div>
        </article>
      </Card>
    </li>
  );
}
