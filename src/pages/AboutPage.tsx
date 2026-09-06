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
import { useAppConfig } from '../app/appConfigContext';
import { useHttpClient } from '../app/httpClientContext';
import { Container, EmptyState, ErrorState, LoadingState, Stack } from '../components';
import { MediaImage } from '../entities/media/MediaImage';
import { MarkdownContent } from '../features/markdown/MarkdownContent';
import { DESCRIPCION_DE_QUIEN_SOY, esquemaDePersona, Seo, textoNoVacio } from '../features/seo';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { RUTAS } from '../lib/rutas';
import { fetchProfile } from '../services/public';

export function AboutPage() {
  const { siteBaseUrl } = useAppConfig();
  const cliente = useHttpClient();

  const cargar = useCallback((signal: AbortSignal) => fetchProfile(cliente, signal), [cliente]);
  const { estado, reintentar } = useAsyncResource(cargar);

  if (estado.fase === 'exito') {
    // La descripcion sale del perfil real: `seo_description` con respaldo en
    // `headline`. Solo si el perfil no trae ninguna de las dos se usa la de la
    // seccion, que describe la pagina sin inventar nada sobre la persona.
    const perfil = estado.datos;
    const descripcion =
      textoNoVacio(perfil.seo_description) ??
      textoNoVacio(perfil.headline) ??
      DESCRIPCION_DE_QUIEN_SOY;
    const persona = esquemaDePersona(perfil, siteBaseUrl);

    return (
      <Container width="prose">
        <Seo
          titulo={textoNoVacio(perfil.seo_title) ?? 'Quién soy'}
          descripcion={descripcion}
          ruta={RUTAS.quienSoy}
          tipo="profile"
          jsonLd={persona === null ? [] : [persona]}
        />
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
      {/* Sin perfil no se emite `Person`: `GET /profile` responde 404 mientras no
          haya semilla (D-009-N), y una persona sin nombre es un hueco, no un dato. */}
      <Seo
        titulo="Quién soy"
        descripcion={DESCRIPCION_DE_QUIEN_SOY}
        ruta={RUTAS.quienSoy}
        tipo="profile"
      />
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
