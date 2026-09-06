/**
 * Listado de articulos (USER_FLOWS A.2, A.9).
 *
 * La pagina y el filtro por etiqueta viven en la URL (decision D-014-H): son
 * enlaces, compartibles y recargables. Cada cambio de URL es una nueva carga
 * porque `cargar` depende de `page` y `tag`.
 */
import { useCallback } from 'react';
import { Link } from 'react-router';

import styles from './listado.module.css';
import { useHttpClient } from '../app/httpClientContext';
import { Container, EmptyState, ErrorState, LoadingState, Pagination, Stack } from '../components';
import { PostCard } from '../entities/posts/PostCard';
import { TagFilter } from '../entities/tags/TagFilter';
import { Seo, DESCRIPCION_DE_ARTICULOS } from '../features/seo';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useParametrosDeListado } from '../hooks/useParametrosDeListado';
import { RUTAS } from '../lib/rutas';
import { fetchPosts } from '../services/public';

export function PostsPage() {
  const cliente = useHttpClient();
  const { page, tag } = useParametrosDeListado();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchPosts(cliente, { page, tag }, signal),
    [cliente, page, tag],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  return (
    <Container width="wide">
      <Stack gap="xl">
        <Seo titulo="Artículos" descripcion={DESCRIPCION_DE_ARTICULOS} ruta={RUTAS.articulos} />
        <h1>Artículos</h1>

        <TagFilter seccion={RUTAS.articulos} />

        {tag !== undefined && (
          <p className={styles['aviso']}>
            Filtrando por la etiqueta <strong>{tag}</strong>.{' '}
            <Link to={RUTAS.articulos}>Ver todos los artículos</Link>
          </p>
        )}

        {estado.fase === 'cargando' && <LoadingState>Cargando artículos…</LoadingState>}

        {(estado.fase === 'error' || estado.fase === 'no-encontrado') && (
          <ErrorState mensaje="No se pudieron cargar los artículos." onRetry={reintentar} />
        )}

        {estado.fase === 'exito' && estado.datos.items.length === 0 && (
          <EmptyState
            mensaje={
              tag === undefined
                ? 'Todavía no hay artículos publicados.'
                : `Todavía no hay artículos publicados con la etiqueta «${tag}».`
            }
          >
            {tag !== undefined && <Link to={RUTAS.articulos}>Ver todos los artículos</Link>}
          </EmptyState>
        )}

        {estado.fase === 'exito' && estado.datos.items.length > 0 && (
          <>
            <ul className={styles['rejilla']} aria-label="Artículos">
              {estado.datos.items.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </ul>
            <Pagination page={estado.datos.page} pages={estado.datos.pages} />
          </>
        )}
      </Stack>
    </Container>
  );
}
