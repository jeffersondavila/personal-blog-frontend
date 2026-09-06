/**
 * Detalle de proyecto (USER_FLOWS A.7; decision D-014-A).
 *
 * Se implementa porque el contrato lo ofrece y `content` es obligatorio para
 * publicar un proyecto (api-contracts.md, seccion 14.5): todo proyecto
 * publicado tiene profundidad que mostrar.
 */
import { useCallback } from 'react';
import { useParams } from 'react-router';

import styles from './detalle.module.css';
import { NotFoundPage } from './NotFoundPage';
import { useAppConfig } from '../app/appConfigContext';
import { useHttpClient } from '../app/httpClientContext';
import { Badge, Container, ErrorState, ExternalLink, LoadingState, Stack } from '../components';
import { PublishedDate } from '../entities/content/PublishedDate';
import { MediaImage } from '../entities/media/MediaImage';
import { ProjectStatusBadge } from '../entities/projects/ProjectStatusBadge';
import { TagLinks } from '../entities/tags/TagLinks';
import { MarkdownContent } from '../features/markdown/MarkdownContent';
import {
  DESCRIPCION_DE_PROYECTOS,
  esquemaDeArticulo,
  esquemaDeMigasDePan,
  Seo,
  textoNoVacio,
  urlAbsoluta,
  type Esquema,
} from '../features/seo';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { RUTAS } from '../lib/rutas';
import { fetchProject } from '../services/public';

export function ProjectDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const rutaDelDetalle = `${RUTAS.proyectos}/${slug}`;
  const { siteBaseUrl } = useAppConfig();
  const cliente = useHttpClient();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchProject(cliente, slug, signal),
    [cliente, slug],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  // Metadatos por URL (E-02, E-03, E-04, E-07). El titulo conserva la semantica
  // que fijo `Task/014`: `undefined` delega en la 404 que se monta debajo.
  const canonica = urlAbsoluta(siteBaseUrl, rutaDelDetalle);
  const esquema =
    estado.fase === 'exito' ? esquemaDeArticulo({ contenido: estado.datos, url: canonica }) : null;
  const estructurados: Esquema[] =
    estado.fase === 'exito'
      ? [
          esquema,
          esquemaDeMigasDePan([
            { nombre: 'Proyectos y laboratorio', url: urlAbsoluta(siteBaseUrl, RUTAS.proyectos) },
            { nombre: estado.datos.title, url: canonica },
          ]),
        ].filter((valor): valor is Esquema => valor !== null)
      : [];

  if (estado.fase === 'no-encontrado') {
    return <NotFoundPage />;
  }

  return (
    <Container width="prose">
      <Seo
        titulo={
          estado.fase === 'exito'
            ? (textoNoVacio(estado.datos.seo_title) ?? estado.datos.title)
            : 'Proyecto'
        }
        descripcion={
          estado.fase === 'exito'
            ? (textoNoVacio(estado.datos.seo_description) ??
              textoNoVacio(estado.datos.summary) ??
              DESCRIPCION_DE_PROYECTOS)
            : DESCRIPCION_DE_PROYECTOS
        }
        ruta={rutaDelDetalle}
        tipo="article"
        jsonLd={estructurados}
      />
      {estado.fase === 'cargando' && <LoadingState>Cargando el proyecto…</LoadingState>}

      {estado.fase === 'error' && (
        <ErrorState mensaje="No se pudo cargar el proyecto." onRetry={reintentar} />
      )}

      {estado.fase === 'exito' && (
        <article>
          <Stack gap="lg">
            <header>
              <Stack gap="sm">
                <h1>{estado.datos.title}</h1>
                <div className={styles['meta']}>
                  <ProjectStatusBadge estado={estado.datos.project_status} />
                  <PublishedDate fecha={estado.datos.published_at} />
                  <span>{estado.datos.reading_time_minutes} min de lectura</span>
                </div>
                {estado.datos.technologies.length > 0 && (
                  <ul className={styles['lista']} aria-label="Tecnologías">
                    {estado.datos.technologies.map((tecnologia) => (
                      <li key={tecnologia}>
                        <Badge>{tecnologia}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                {(estado.datos.repository_url !== null || estado.datos.demo_url !== null) && (
                  <p className={styles['acciones']}>
                    {estado.datos.repository_url !== null && (
                      <ExternalLink href={estado.datos.repository_url}>Repositorio</ExternalLink>
                    )}
                    {estado.datos.demo_url !== null && (
                      <ExternalLink href={estado.datos.demo_url}>Demo</ExternalLink>
                    )}
                  </p>
                )}
                <TagLinks seccion={RUTAS.proyectos} tags={estado.datos.tags} />
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
