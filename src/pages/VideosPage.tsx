/**
 * Listado de videos (USER_FLOWS A.6, A.9).
 *
 * No hay pagina de detalle: el listado transporta los datos de reproduccion y
 * cada tarjeta lleva `id={slug}` para que un enlace `/videos#<slug>` llegue a
 * ella (decision D-014-J).
 */
import { useCallback } from 'react';
import { Link } from 'react-router';

import styles from './listado.module.css';
import { useHttpClient } from '../app/httpClientContext';
import { Container, EmptyState, ErrorState, LoadingState, Pagination, Stack } from '../components';
import { TagFilter } from '../entities/tags/TagFilter';
import { VideoCard } from '../entities/videos/VideoCard';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useParametrosDeListado } from '../hooks/useParametrosDeListado';
import { RUTAS } from '../lib/rutas';
import { fetchVideos } from '../services/public';

export function VideosPage() {
  useDocumentTitle('Videos');
  const cliente = useHttpClient();
  const { page, tag } = useParametrosDeListado();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchVideos(cliente, { page, tag }, signal),
    [cliente, page, tag],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  return (
    <Container width="wide">
      <Stack gap="xl">
        <h1>Videos</h1>

        <TagFilter seccion={RUTAS.videos} />

        {tag !== undefined && (
          <p className={styles['aviso']}>
            Filtrando por la etiqueta <strong>{tag}</strong>.{' '}
            <Link to={RUTAS.videos}>Ver todos los videos</Link>
          </p>
        )}

        {estado.fase === 'cargando' && <LoadingState>Cargando videos…</LoadingState>}

        {(estado.fase === 'error' || estado.fase === 'no-encontrado') && (
          <ErrorState mensaje="No se pudieron cargar los videos." onRetry={reintentar} />
        )}

        {estado.fase === 'exito' && estado.datos.items.length === 0 && (
          <EmptyState
            mensaje={
              tag === undefined
                ? 'Todavía no hay videos publicados.'
                : `Todavía no hay videos publicados con la etiqueta «${tag}».`
            }
          >
            {tag !== undefined && <Link to={RUTAS.videos}>Ver todos los videos</Link>}
          </EmptyState>
        )}

        {estado.fase === 'exito' && estado.datos.items.length > 0 && (
          <>
            <ul className={styles['rejilla']} aria-label="Videos">
              {estado.datos.items.map((video) => (
                <VideoCard key={video.slug} video={video} />
              ))}
            </ul>
            <Pagination page={estado.datos.page} pages={estado.datos.pages} />
          </>
        )}
      </Stack>
    </Container>
  );
}
