/** Listado de proyectos y laboratorio (USER_FLOWS A.7, A.9). */
import { useCallback } from 'react';
import { Link } from 'react-router';

import styles from './listado.module.css';
import { useHttpClient } from '../app/httpClientContext';
import { Container, EmptyState, ErrorState, LoadingState, Pagination, Stack } from '../components';
import { ProjectCard } from '../entities/projects/ProjectCard';
import { TagFilter } from '../entities/tags/TagFilter';
import { Seo, DESCRIPCION_DE_PROYECTOS } from '../features/seo';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useParametrosDeListado } from '../hooks/useParametrosDeListado';
import { RUTAS } from '../lib/rutas';
import { fetchProjects } from '../services/public';

export function ProjectsPage() {
  const cliente = useHttpClient();
  const { page, tag } = useParametrosDeListado();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchProjects(cliente, { page, tag }, signal),
    [cliente, page, tag],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  return (
    <Container width="wide">
      <Stack gap="xl">
        <Seo
          titulo="Proyectos y laboratorio"
          descripcion={DESCRIPCION_DE_PROYECTOS}
          ruta={RUTAS.proyectos}
        />
        <h1>Proyectos y laboratorio</h1>

        <TagFilter seccion={RUTAS.proyectos} />

        {tag !== undefined && (
          <p className={styles['aviso']}>
            Filtrando por la etiqueta <strong>{tag}</strong>.{' '}
            <Link to={RUTAS.proyectos}>Ver todos los proyectos</Link>
          </p>
        )}

        {estado.fase === 'cargando' && <LoadingState>Cargando proyectos…</LoadingState>}

        {(estado.fase === 'error' || estado.fase === 'no-encontrado') && (
          <ErrorState mensaje="No se pudieron cargar los proyectos." onRetry={reintentar} />
        )}

        {estado.fase === 'exito' && estado.datos.items.length === 0 && (
          <EmptyState
            mensaje={
              tag === undefined
                ? 'Todavía no hay proyectos publicados.'
                : `Todavía no hay proyectos publicados con la etiqueta «${tag}».`
            }
          >
            {tag !== undefined && <Link to={RUTAS.proyectos}>Ver todos los proyectos</Link>}
          </EmptyState>
        )}

        {estado.fase === 'exito' && estado.datos.items.length > 0 && (
          <>
            <ul className={styles['rejilla']} aria-label="Proyectos">
              {estado.datos.items.map((proyecto) => (
                <ProjectCard key={proyecto.slug} proyecto={proyecto} />
              ))}
            </ul>
            <Pagination page={estado.datos.page} pages={estado.datos.pages} />
          </>
        )}
      </Stack>
    </Container>
  );
}
