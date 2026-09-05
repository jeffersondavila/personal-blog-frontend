/**
 * Contacto y enlaces (USER_FLOWS A.10; MVP_SCOPE seccion 4).
 *
 * Correo como `mailto:` y redes como enlaces externos seguros, en el orden que
 * el autor configuro (el array del contrato ya viene ordenado). **Sin
 * formulario**: MVP_SCOPE lo excluye a proposito.
 *
 * El `404` del perfil es «todavia no disponible» (decision D-014-K), no una
 * pagina 404: la ruta existe.
 */
import { useCallback } from 'react';

import styles from './detalle.module.css';
import { useHttpClient } from '../app/httpClientContext';
import {
  Container,
  EmptyState,
  ErrorState,
  ExternalLink,
  LoadingState,
  Stack,
} from '../components';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fetchProfile } from '../services/public';

export function ContactPage() {
  useDocumentTitle('Contacto');
  const cliente = useHttpClient();

  const cargar = useCallback((signal: AbortSignal) => fetchProfile(cliente, signal), [cliente]);
  const { estado, reintentar } = useAsyncResource(cargar);

  return (
    <Container width="prose">
      <Stack gap="lg">
        <h1>Contacto</h1>

        {estado.fase === 'cargando' && <LoadingState>Cargando los datos de contacto…</LoadingState>}

        {estado.fase === 'no-encontrado' && (
          <EmptyState mensaje="Los datos de contacto aún no están disponibles." />
        )}

        {estado.fase === 'error' && (
          <ErrorState mensaje="No se pudieron cargar los datos de contacto." onRetry={reintentar} />
        )}

        {estado.fase === 'exito' &&
          estado.datos.contact_email === null &&
          estado.datos.social_links.length === 0 && (
            <EmptyState mensaje="No hay datos de contacto publicados todavía." />
          )}

        {estado.fase === 'exito' && estado.datos.contact_email !== null && (
          <p>
            Puedes escribirme a{' '}
            <a href={`mailto:${estado.datos.contact_email}`}>{estado.datos.contact_email}</a>.
          </p>
        )}

        {estado.fase === 'exito' && estado.datos.social_links.length > 0 && (
          <section>
            <Stack gap="sm">
              <h2>Redes y enlaces</h2>
              <ul className={styles['lista']} aria-label="Redes y enlaces">
                {estado.datos.social_links.map((enlace) => (
                  <li key={`${enlace.label}-${enlace.url}`}>
                    <ExternalLink href={enlace.url}>{enlace.label}</ExternalLink>
                  </li>
                ))}
              </ul>
            </Stack>
          </section>
        )}
      </Stack>
    </Container>
  );
}
