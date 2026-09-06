/** Listado de reviews de libros (USER_FLOWS A.4, A.9). Misma composicion que los articulos. */
import { useCallback } from 'react';
import { Link } from 'react-router';

import styles from './listado.module.css';
import { useHttpClient } from '../app/httpClientContext';
import { Container, EmptyState, ErrorState, LoadingState, Pagination, Stack } from '../components';
import { ReviewCard } from '../entities/book-reviews/ReviewCard';
import { TagFilter } from '../entities/tags/TagFilter';
import { Seo, DESCRIPCION_DE_REVIEWS } from '../features/seo';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useParametrosDeListado } from '../hooks/useParametrosDeListado';
import { RUTAS } from '../lib/rutas';
import { fetchBookReviews } from '../services/public';

export function BookReviewsPage() {
  const cliente = useHttpClient();
  const { page, tag } = useParametrosDeListado();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchBookReviews(cliente, { page, tag }, signal),
    [cliente, page, tag],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  return (
    <Container width="wide">
      <Stack gap="xl">
        <Seo titulo="Reviews de libros" descripcion={DESCRIPCION_DE_REVIEWS} ruta={RUTAS.reviews} />
        <h1>Reviews de libros</h1>

        <TagFilter seccion={RUTAS.reviews} />

        {tag !== undefined && (
          <p className={styles['aviso']}>
            Filtrando por la etiqueta <strong>{tag}</strong>.{' '}
            <Link to={RUTAS.reviews}>Ver todas las reviews</Link>
          </p>
        )}

        {estado.fase === 'cargando' && <LoadingState>Cargando reviews…</LoadingState>}

        {(estado.fase === 'error' || estado.fase === 'no-encontrado') && (
          <ErrorState mensaje="No se pudieron cargar las reviews." onRetry={reintentar} />
        )}

        {estado.fase === 'exito' && estado.datos.items.length === 0 && (
          <EmptyState
            mensaje={
              tag === undefined
                ? 'Todavía no hay reviews publicadas.'
                : `Todavía no hay reviews publicadas con la etiqueta «${tag}».`
            }
          >
            {tag !== undefined && <Link to={RUTAS.reviews}>Ver todas las reviews</Link>}
          </EmptyState>
        )}

        {estado.fase === 'exito' && estado.datos.items.length > 0 && (
          <>
            <ul className={styles['rejilla']} aria-label="Reviews de libros">
              {estado.datos.items.map((review) => (
                <ReviewCard key={review.slug} review={review} />
              ))}
            </ul>
            <Pagination page={estado.datos.page} pages={estado.datos.pages} />
          </>
        )}
      </Stack>
    </Container>
  );
}
