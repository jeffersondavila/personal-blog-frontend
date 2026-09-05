/**
 * Inicio (USER_FLOWS A.1): presentacion breve del autor, contenido destacado
 * de cada tipo y accesos a las secciones.
 *
 * Cinco peticiones **independientes** —perfil y destacados de artículos,
 * reviews, videos y proyectos—, cada una con su propio estado de carga, vacío,
 * error y reintento. Un bloque que falla no tumba la portada: *«si falla la
 * carga, se muestra un estado de error con reintento; el sitio no queda en
 * blanco»*.
 *
 * El `404` del perfil (sin semilla hasta `Task/022`, decision D-009-N) omite
 * la presentacion y deja el nombre del sitio como `h1`: no es un error del
 * visitante y no se muestra como tal (decision D-014-K).
 *
 * La biografia **no** se renderiza aqui: Inicio muestra una presentacion breve
 * y enlaza a Quién soy, de modo que la portada no descarga el renderizador
 * Markdown.
 *
 * Sustituye a la pantalla provisional de fundacion de `Task/006`/`Task/007`
 * (decision D-014-G).
 */
import { useCallback, type ReactNode } from 'react';
import { Link } from 'react-router';

import styles from './HomePage.module.css';
import listado from './listado.module.css';
import { useHttpClient } from '../app/httpClientContext';
import { Container, EmptyState, ErrorState, LoadingState, Stack } from '../components';
import { ReviewCard } from '../entities/book-reviews/ReviewCard';
import { MediaImage } from '../entities/media/MediaImage';
import { PostCard } from '../entities/posts/PostCard';
import { ProjectCard } from '../entities/projects/ProjectCard';
import { VideoCard } from '../entities/videos/VideoCard';
import { useAsyncResource, type Cargador } from '../hooks/useAsyncResource';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { NOMBRE_DEL_SITIO } from '../lib/site';
import {
  fetchBookReviews,
  fetchPosts,
  fetchProfile,
  fetchProjects,
  fetchVideos,
  type Pagina,
  type ParametrosDeListado,
} from '../services/public';

/** Destacados por tipo en Inicio (decision D-014-I). */
const DESTACADOS: ParametrosDeListado = { featured: true, pageSize: 3 };

export function HomePage() {
  useDocumentTitle(null);
  const cliente = useHttpClient();

  const cargarPerfil = useCallback(
    (signal: AbortSignal) => fetchProfile(cliente, signal),
    [cliente],
  );
  const cargarPosts = useCallback(
    (signal: AbortSignal) => fetchPosts(cliente, DESTACADOS, signal),
    [cliente],
  );
  const cargarReviews = useCallback(
    (signal: AbortSignal) => fetchBookReviews(cliente, DESTACADOS, signal),
    [cliente],
  );
  const cargarVideos = useCallback(
    (signal: AbortSignal) => fetchVideos(cliente, DESTACADOS, signal),
    [cliente],
  );
  const cargarProyectos = useCallback(
    (signal: AbortSignal) => fetchProjects(cliente, DESTACADOS, signal),
    [cliente],
  );

  return (
    <Container width="wide">
      <Stack gap="2xl">
        <Presentacion cargar={cargarPerfil} />

        <SeccionDestacados
          id="destacados-articulos"
          titulo="Artículos destacados"
          ruta={RUTAS.articulos}
          textoEnlace="Ver todos los artículos"
          mensajeVacio="Todavía no hay artículos destacados."
          mensajeError="No se pudieron cargar los artículos destacados."
          cargar={cargarPosts}
          render={(items) =>
            items.map((post) => <PostCard key={post.slug} post={post} nivelDeTitulo={3} />)
          }
        />

        <SeccionDestacados
          id="destacados-reviews"
          titulo="Reviews destacadas"
          ruta={RUTAS.reviews}
          textoEnlace="Ver todas las reviews"
          mensajeVacio="Todavía no hay reviews destacadas."
          mensajeError="No se pudieron cargar las reviews destacadas."
          cargar={cargarReviews}
          render={(items) =>
            items.map((review) => (
              <ReviewCard key={review.slug} review={review} nivelDeTitulo={3} />
            ))
          }
        />

        <SeccionDestacados
          id="destacados-videos"
          titulo="Videos destacados"
          ruta={RUTAS.videos}
          textoEnlace="Ver todos los videos"
          mensajeVacio="Todavía no hay videos destacados."
          mensajeError="No se pudieron cargar los videos destacados."
          cargar={cargarVideos}
          render={(items) =>
            items.map((video) => <VideoCard key={video.slug} video={video} nivelDeTitulo={3} />)
          }
        />

        <SeccionDestacados
          id="destacados-proyectos"
          titulo="Proyectos destacados"
          ruta={RUTAS.proyectos}
          textoEnlace="Ver todos los proyectos"
          mensajeVacio="Todavía no hay proyectos destacados."
          mensajeError="No se pudieron cargar los proyectos destacados."
          cargar={cargarProyectos}
          render={(items) =>
            items.map((proyecto) => (
              <ProjectCard key={proyecto.slug} proyecto={proyecto} nivelDeTitulo={3} />
            ))
          }
        />
      </Stack>
    </Container>
  );
}

/** Presentacion breve del autor. Especifica de esta pagina. */
function Presentacion({
  cargar,
}: {
  readonly cargar: Cargador<Awaited<ReturnType<typeof fetchProfile>>>;
}) {
  const { estado, reintentar } = useAsyncResource(cargar);

  if (estado.fase === 'exito') {
    return (
      <header className={styles['presentacion']}>
        <MediaImage medio={estado.datos.photo} className={styles['foto']} prioridad="alta" />
        <Stack gap="sm">
          <h1>{estado.datos.full_name}</h1>
          {estado.datos.headline !== null && (
            <p className={styles['titular']}>{estado.datos.headline}</p>
          )}
          <p>
            <Link to={RUTAS.quienSoy}>Quién soy</Link>
          </p>
        </Stack>
      </header>
    );
  }

  return (
    <header className={styles['presentacion']}>
      <Stack gap="sm">
        <h1>{NOMBRE_DEL_SITIO}</h1>
        {estado.fase === 'cargando' && <LoadingState>Cargando la presentación…</LoadingState>}
        {estado.fase === 'error' && (
          <ErrorState mensaje="No se pudo cargar la presentación." onRetry={reintentar} />
        )}
        {/* Sin perfil todavia (D-014-K): la portada sigue en pie sin presentacion. */}
      </Stack>
    </header>
  );
}

interface SeccionDestacadosProps<T> {
  readonly id: string;
  readonly titulo: string;
  readonly ruta: string;
  readonly textoEnlace: string;
  readonly mensajeVacio: string;
  readonly mensajeError: string;
  readonly cargar: Cargador<Pagina<T>>;
  readonly render: (items: readonly T[]) => ReactNode;
}

/** Bloque de destacados de un tipo, con su propio ciclo de vida. Especifico de esta pagina. */
function SeccionDestacados<T>({
  id,
  titulo,
  ruta,
  textoEnlace,
  mensajeVacio,
  mensajeError,
  cargar,
  render,
}: SeccionDestacadosProps<T>) {
  const { estado, reintentar } = useAsyncResource(cargar);

  return (
    <section aria-labelledby={id}>
      <Stack gap="lg">
        <div className={styles['cabeceraDeSeccion']}>
          <h2 id={id}>{titulo}</h2>
          <Link to={ruta}>{textoEnlace}</Link>
        </div>

        {estado.fase === 'cargando' && (
          <LoadingState>Cargando {titulo.toLowerCase()}…</LoadingState>
        )}

        {(estado.fase === 'error' || estado.fase === 'no-encontrado') && (
          <ErrorState mensaje={mensajeError} onRetry={reintentar} />
        )}

        {estado.fase === 'exito' && estado.datos.items.length === 0 && (
          <EmptyState mensaje={mensajeVacio} />
        )}

        {estado.fase === 'exito' && estado.datos.items.length > 0 && (
          <ul className={listado['rejilla']} aria-label={titulo}>
            {render(estado.datos.items)}
          </ul>
        )}
      </Stack>
    </section>
  );
}
