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
import { useAppConfig } from '../app/appConfigContext';
import { useHttpClient } from '../app/httpClientContext';
import { Container, ErrorState, LoadingState, Stack } from '../components';
import { PublishedDate } from '../entities/content/PublishedDate';
import { MediaImage } from '../entities/media/MediaImage';
import { TagLinks } from '../entities/tags/TagLinks';
import { MarkdownContent } from '../features/markdown/MarkdownContent';
import {
  DESCRIPCION_DE_ARTICULOS,
  esquemaDeArticulo,
  esquemaDeMigasDePan,
  Seo,
  textoNoVacio,
  urlAbsoluta,
  type Esquema,
} from '../features/seo';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { RUTAS } from '../lib/rutas';
import { fetchPost } from '../services/public';

export function PostDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const rutaDelDetalle = `${RUTAS.articulos}/${slug}`;
  const { siteBaseUrl } = useAppConfig();
  const cliente = useHttpClient();

  const cargar = useCallback(
    (signal: AbortSignal) => fetchPost(cliente, slug, signal),
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
            { nombre: 'Artículos', url: urlAbsoluta(siteBaseUrl, RUTAS.articulos) },
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
            : 'Artículo'
        }
        descripcion={
          estado.fase === 'exito'
            ? (textoNoVacio(estado.datos.seo_description) ??
              textoNoVacio(estado.datos.summary) ??
              DESCRIPCION_DE_ARTICULOS)
            : DESCRIPCION_DE_ARTICULOS
        }
        ruta={rutaDelDetalle}
        tipo="article"
        jsonLd={estructurados}
      />
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
