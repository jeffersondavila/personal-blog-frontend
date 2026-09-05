/**
 * Tabla de rutas de la aplicacion.
 *
 * Se define como datos —un `RouteObject[]`— en lugar de construir el router
 * aqui. Asi la misma tabla alimenta el router de navegador en produccion y un
 * router en memoria en las pruebas, y no existe la posibilidad de que lo que
 * se prueba y lo que se sirve diverjan.
 *
 * Las doce superficies del sitio publico (decision D-014-A de `Task/014`)
 * cuelgan de una ruta de layout sin `path`: `SiteLayout` aporta cabecera,
 * navegacion, buscador y pie, y cada pagina solo su contenido. **No existe**
 * `/videos/:slug`: el contrato no tiene detalle de video.
 *
 * El comodin `*` sigue siendo la **ultima** ruta de la tabla. Monta la pagina
 * 404 dentro del mismo layout, de modo que una direccion equivocada conserva
 * la navegacion del sitio (USER_FLOWS A.11).
 *
 * Las rutas del panel administrativo llegan en `Task/015`.
 */
import type { RouteObject } from 'react-router';

import { SiteLayout } from './SiteLayout';
import { RUTAS } from '../lib/rutas';
import { AboutPage } from '../pages/AboutPage';
import { BookReviewDetailPage } from '../pages/BookReviewDetailPage';
import { BookReviewsPage } from '../pages/BookReviewsPage';
import { ContactPage } from '../pages/ContactPage';
import { DesignSystemPage } from '../pages/DesignSystemPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { PostsPage } from '../pages/PostsPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { SearchPage } from '../pages/SearchPage';
import { VideosPage } from '../pages/VideosPage';

/** Ruta de la superficie de demostracion del sistema de diseno. */
export const DESIGN_SYSTEM_PATH = '/__design-system';

/**
 * Rutas que solo existen mientras se desarrolla.
 *
 * `import.meta.env.DEV` lo sustituye Vite por una constante en tiempo de
 * build, de modo que en produccion esto es `false` literal y el arreglo
 * —junto con el componente al que apunta— desaparece del bundle. No es una
 * ruta «oculta»: **no existe**.
 *
 * Que no llegue a produccion importa mas alla del peso: una ruta de producto
 * no prevista contaminaria el sitemap y el `robots.txt` de `Task/016`. La
 * ausencia se comprueba sobre `dist/` como parte de la validacion.
 *
 * El doble guion bajo del prefijo evita cualquier colision con las rutas
 * reales del MVP.
 */
const developmentRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: DESIGN_SYSTEM_PATH, element: <DesignSystemPage /> }]
  : [];

/** Quita la barra inicial: las rutas hijas de un layout son relativas. */
function relativa(ruta: string): string {
  return ruta.replace(/^\//, '');
}

export const routes: RouteObject[] = [
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: relativa(RUTAS.quienSoy), element: <AboutPage /> },
      { path: relativa(RUTAS.articulos), element: <PostsPage /> },
      { path: `${relativa(RUTAS.articulos)}/:slug`, element: <PostDetailPage /> },
      { path: relativa(RUTAS.reviews), element: <BookReviewsPage /> },
      { path: `${relativa(RUTAS.reviews)}/:slug`, element: <BookReviewDetailPage /> },
      { path: relativa(RUTAS.videos), element: <VideosPage /> },
      { path: relativa(RUTAS.proyectos), element: <ProjectsPage /> },
      { path: `${relativa(RUTAS.proyectos)}/:slug`, element: <ProjectDetailPage /> },
      { path: relativa(RUTAS.contacto), element: <ContactPage /> },
      { path: relativa(RUTAS.buscar), element: <SearchPage /> },
    ],
  },
  ...developmentRoutes,
  {
    // Comodin: cualquier ruta no reconocida termina en la pagina 404 en lugar
    // de en una pantalla en blanco. Va el ultimo a proposito: si estuviera
    // antes, absorberia cualquier ruta anadida despues.
    path: '*',
    element: (
      <SiteLayout>
        <NotFoundPage />
      </SiteLayout>
    ),
  },
];
