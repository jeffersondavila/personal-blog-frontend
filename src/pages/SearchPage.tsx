/**
 * Resultados de busqueda (USER_FLOWS A.8).
 *
 * El termino y la pagina viven en la URL (`?q=`, `?page=`): el buscador de la
 * cabecera navega aqui con un `GET` del formulario. Con menos de dos
 * caracteres **no se llama al API** —el contrato responderia `422`— y se
 * explica el minimo.
 *
 * La coleccion es plana con discriminador `type` (decision D-009-J): cada
 * resultado se etiqueta con su tipo y enlaza a su destino. Un video no tiene
 * detalle, asi que enlaza al listado con un ancla a su tarjeta (D-014-J).
 */
import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';

import styles from './listado.module.css';
import { useHttpClient } from '../app/httpClientContext';
import {
  Badge,
  Card,
  Container,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  Stack,
} from '../components';
import { PublishedDate } from '../entities/content/PublishedDate';
import tarjeta from '../entities/content/tarjeta.module.css';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { leerPagina } from '../hooks/useParametrosDeListado';
import { rutaDeContenido, SECCIONES } from '../lib/rutas';
import {
  fetchSearch,
  LONGITUD_MINIMA_DE_BUSQUEDA,
  normalizarTermino,
  type Pagina,
  type ResultadoDeBusqueda,
  type TipoDeContenido,
} from '../services/public';

const NOMBRE_DE_TIPO: Readonly<Record<TipoDeContenido, string>> = {
  post: 'Artículo',
  book_review: 'Review',
  video: 'Video',
  project: 'Proyecto',
};

export function SearchPage() {
  const cliente = useHttpClient();
  const [parametros] = useSearchParams();
  const termino = normalizarTermino(parametros.get('q'));
  const page = leerPagina(parametros.get('page'));

  useDocumentTitle(termino === null ? 'Búsqueda' : `Resultados para «${termino}»`);

  const cargar = useCallback(
    (signal: AbortSignal): Promise<Pagina<ResultadoDeBusqueda> | null> =>
      termino === null ? Promise.resolve(null) : fetchSearch(cliente, { q: termino, page }, signal),
    [cliente, termino, page],
  );
  const { estado, reintentar } = useAsyncResource(cargar);

  return (
    <Container width="wide">
      <Stack gap="xl">
        <h1>{termino === null ? 'Búsqueda' : `Resultados para «${termino}»`}</h1>

        {termino === null && (
          <p className={styles['aviso']}>
            Escribe al menos {LONGITUD_MINIMA_DE_BUSQUEDA} caracteres en el buscador para buscar
            entre los artículos, reviews, videos y proyectos publicados.
          </p>
        )}

        {termino !== null && estado.fase === 'cargando' && <LoadingState>Buscando…</LoadingState>}

        {termino !== null && (estado.fase === 'error' || estado.fase === 'no-encontrado') && (
          <ErrorState mensaje="No se pudo completar la búsqueda." onRetry={reintentar} />
        )}

        {termino !== null &&
          estado.fase === 'exito' &&
          estado.datos !== null &&
          estado.datos.items.length === 0 && (
            <EmptyState mensaje={`Sin resultados para «${termino}».`}>
              <nav aria-label="Secciones del sitio">
                <Stack direction="horizontal" gap="md" wrap>
                  {SECCIONES.map((seccion) => (
                    <Link key={seccion.ruta} to={seccion.ruta}>
                      {seccion.nombre}
                    </Link>
                  ))}
                </Stack>
              </nav>
            </EmptyState>
          )}

        {termino !== null &&
          estado.fase === 'exito' &&
          estado.datos !== null &&
          estado.datos.items.length > 0 && (
            <>
              <ul className={styles['resultados']} aria-label="Resultados">
                {estado.datos.items.map((item) => (
                  <ResultadoItem key={`${item.type}-${item.slug}`} resultado={item} />
                ))}
              </ul>
              <Pagination page={estado.datos.page} pages={estado.datos.pages} />
            </>
          )}
      </Stack>
    </Container>
  );
}

/** Un resultado: especifico de esta pagina, no se eleva a entidad. */
function ResultadoItem({ resultado }: { readonly resultado: ResultadoDeBusqueda }) {
  return (
    <li className={tarjeta['item']}>
      <Card className={tarjeta['tarjeta']}>
        <article className={tarjeta['articulo']}>
          <div className={tarjeta['meta']}>
            <Badge>{NOMBRE_DE_TIPO[resultado.type]}</Badge>
            <PublishedDate fecha={resultado.published_at} />
          </div>
          <h2 className={tarjeta['titulo']}>
            <Link to={rutaDeContenido(resultado.type, resultado.slug)}>{resultado.title}</Link>
          </h2>
          {resultado.summary !== null && <p className={tarjeta['resumen']}>{resultado.summary}</p>}
        </article>
      </Card>
    </li>
  );
}
