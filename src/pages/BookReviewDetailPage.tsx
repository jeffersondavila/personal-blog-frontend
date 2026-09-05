/** Detalle de review (USER_FLOWS A.5): libro, autor, valoracion, enlace externo y contenido. */
import { useCallback } from 'react';
import { useParams } from 'react-router';

import styles from './detalle.module.css';
import { NotFoundPage } from './NotFoundPage';
import { useHttpClient } from '../app/httpClientContext';
import { Container, ErrorState, ExternalLink, LoadingState, Stack } from '../components';
import { Rating } from '../entities/book-reviews/Rating';
import { describirLibro } from '../entities/book-reviews/libro';
import { PublishedDate } from '../entities/content/PublishedDate';
import { MediaImage } from '../entities/media/MediaImage';
import { TagLinks } from '../entities/tags/TagLinks';
import { MarkdownContent } from '../features/markdown/MarkdownContent';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { fetchBookReview } from '../services/public';

export function BookReviewDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const cliente = useHttpClient();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchBookReview(cliente, slug, signal),
    [cliente, slug],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  useDocumentTitle(
    estado.fase === 'exito'
      ? estado.datos.title
      : estado.fase === 'no-encontrado'
        ? undefined
        : 'Review',
  );

  if (estado.fase === 'no-encontrado') {
    return <NotFoundPage />;
  }

  return (
    <Container width="prose">
      {estado.fase === 'cargando' && <LoadingState>Cargando la review…</LoadingState>}

      {estado.fase === 'error' && (
        <ErrorState mensaje="No se pudo cargar la review." onRetry={reintentar} />
      )}

      {estado.fase === 'exito' && (
        <article>
          <Stack gap="lg">
            <header>
              <Stack gap="sm">
                <h1>{estado.datos.title}</h1>
                {describirLibro(estado.datos) !== null && (
                  <p className={styles['titular']}>{describirLibro(estado.datos)}</p>
                )}
                <p className={styles['meta']}>
                  <PublishedDate fecha={estado.datos.published_at} />
                  <span>{estado.datos.reading_time_minutes} min de lectura</span>
                </p>
                <Rating rating={estado.datos.rating} />
                <TagLinks seccion={RUTAS.reviews} tags={estado.datos.tags} />
              </Stack>
            </header>

            <MediaImage medio={estado.datos.cover} className={styles['portada']} prioridad="alta" />

            <MarkdownContent markdown={estado.datos.content} />

            {estado.datos.external_link !== null && (
              <p>
                <ExternalLink href={estado.datos.external_link}>Ficha del libro</ExternalLink>
              </p>
            )}
          </Stack>
        </article>
      )}
    </Container>
  );
}
