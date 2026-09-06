/**
 * Pagina 404 del sitio publico (USER_FLOWS A.11).
 *
 * La monta el comodin de la tabla de rutas y tambien cada pagina de detalle
 * cuando el API responde `404` por slug: un articulo inexistente, un borrador
 * y un archivado deben terminar en **la misma** experiencia, sin distinguirlos
 * (USER_FLOWS A.3, api-contracts.md seccion 3).
 *
 * Ofrece salida a Inicio y a las secciones principales. El codigo HTTP `404`
 * real y el `noindex` no pueden fijarse desde una SPA estatica: son de
 * `Task/016` y `Task/034`.
 */
import { Link } from 'react-router';

import { Container, Stack } from '../components';
import { DESCRIPCION_DE_LA_404, Seo } from '../features/seo';
import { RUTAS, SECCIONES } from '../lib/rutas';

export function NotFoundPage() {
  return (
    <Container width="prose">
      {/* `noindex` (E-06). El CODIGO HTTP `404` real depende del *hosting* y es de
          `Task/034`: un servidor estatico no distingue esta ruta de un slug valido. */}
      <Seo
        titulo="Página no encontrada"
        descripcion={DESCRIPCION_DE_LA_404}
        ruta={RUTAS.inicio}
        indexable={false}
      />
      <Stack gap="lg">
        <h1>404: página no encontrada</h1>

        <p>
          La dirección que abriste no corresponde a ningún contenido publicado de este sitio. Puede
          que el enlace esté mal escrito o que el contenido ya no esté disponible.
        </p>

        <nav aria-label="Secciones del sitio">
          <ul>
            <li>
              <Link to={RUTAS.inicio}>Volver al inicio</Link>
            </li>
            {SECCIONES.map((seccion) => (
              <li key={seccion.ruta}>
                <Link to={seccion.ruta}>{seccion.nombre}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </Stack>
    </Container>
  );
}
