/**
 * Detalle de articulo (USER_FLOWS A.3).
 *
 * Un `404` del API —slug inexistente, borrador o archivado, indistinguibles
 * por contrato— monta la **misma** pagina 404 publica y deja que ella fije el
 * titulo. Cualquier otro fallo se muestra con «Reintentar».
 */
import { useCallback } from 'react';
import { useParams } from 'react-router';

import styles from './detalle.module.css';
import { NotFoundPage } from './NotFoundPage';
import { useHttpClient } from '../app/httpClientContext';
import { Container, ErrorState, LoadingState, Stack } from '../components';
import { PublishedDate } from '../entities/content/PublishedDate';
import { MediaImage } from '../entities/media/MediaImage';
import { TagLinks } from '../entities/tags/TagLinks';
import { MarkdownContent } from '../features/markdown/MarkdownContent';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { fetchPost } from '../services/public';

export function PostDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const cliente = useHttpClient();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchPost(cliente, slug, signal),
    [cliente, slug],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  useDocumentTitle(
    estado.fase === 'exito'
      ? estado.datos.title
      : estado.fase === 'no-encontrado'
        ? undefined
        : 'Artículo',
  );

  if (estado.fase === 'no-encontrado') {
    return <NotFoundPage />;
  }

  return (
    <Container width="prose">
      {estado.fase === 'cargando' && <LoadingState>Cargando el artículo…</LoadingState>}

      {estado.fase === 'error' && (
        <ErrorState mensaje="No se pudo cargar el artículo." onRetry={reintentar} />
      )}

      {estado.fase === 'exito' && (
        <article>
          <Stack gap="lg">
            <header>
              <Stack gap="sm">
                <h1>{estado.datos.title}</h1>
                <p className={styles['meta']}>
                  <PublishedDate fecha={estado.datos.published_at} />
                  <span>{estado.datos.reading_time_minutes} min de lectura</span>
                </p>
                <TagLinks seccion={RUTAS.articulos} tags={estado.datos.tags} />
              </Stack>
            </header>

            <MediaImage medio={estado.datos.cover} className={styles['portada']} prioridad="alta" />

            <MarkdownContent markdown={estado.datos.content} />
          </Stack>
        </article>
      )}
    </Container>
  );
}
