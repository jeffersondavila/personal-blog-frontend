/**
 * Quién soy (CONTENT_MODEL seccion 3.1; USER_FLOWS B.10 refleja aqui el perfil).
 *
 * El `404` de `GET /profile` **no es una ruta inexistente**: la ruta existe y
 * lo que falta es la semilla (decision D-009-N, hasta `Task/022`). Se muestra
 * como estado explicito «perfil aun no disponible» (decision D-014-K).
 *
 * La biografia es Markdown y pasa por el **mismo** pipeline sanitizado que los
 * detalles (ADR-005).
 */
import { useCallback } from 'react';

import styles from './detalle.module.css';
import { useHttpClient } from '../app/httpClientContext';
import { Container, EmptyState, ErrorState, LoadingState, Stack } from '../components';
import { MediaImage } from '../entities/media/MediaImage';
import { MarkdownContent } from '../features/markdown/MarkdownContent';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fetchProfile } from '../services/public';

export function AboutPage() {
  useDocumentTitle('Quién soy');
  const cliente = useHttpClient();

  const cargar = useCallback((signal: AbortSignal) => fetchProfile(cliente, signal), [cliente]);
  const { estado, reintentar } = useAsyncResource(cargar);

  if (estado.fase === 'exito') {
    return (
      <Container width="prose">
        <article>
          <Stack gap="lg">
            <header>
              <Stack gap="sm">
                <h1>{estado.datos.full_name}</h1>
                {estado.datos.headline !== null && (
                  <p className={styles['titular']}>{estado.datos.headline}</p>
                )}
              </Stack>
            </header>

            <MediaImage medio={estado.datos.photo} className={styles['retrato']} prioridad="alta" />

            <MarkdownContent markdown={estado.datos.biography} />
          </Stack>
        </article>
      </Container>
    );
  }

  return (
    <Container width="prose">
      <Stack gap="lg">
        <h1>Quién soy</h1>

        {estado.fase === 'cargando' && <LoadingState>Cargando el perfil…</LoadingState>}

        {estado.fase === 'no-encontrado' && (
          <EmptyState mensaje="El perfil aún no está disponible." />
        )}

        {estado.fase === 'error' && (
          <ErrorState mensaje="No se pudo cargar el perfil." onRetry={reintentar} />
        )}
      </Stack>
    </Container>
  );
}
