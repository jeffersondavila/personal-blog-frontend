/**
 * Tabla de rutas de la aplicacion.
 *
 * Se define como datos —un `RouteObject[]`— en lugar de construir el router
 * aqui. Asi la misma tabla alimenta el router de navegador en produccion y un
 * router en memoria en las pruebas, y no existe la posibilidad de que lo que
 * se prueba y lo que se sirve diverjan.
 *
 * Las rutas del blog —articulos, reviews, videos, proyectos, contacto— y las
 * del panel administrativo llegan en `Task/014` y `Task/015`. Aqui solo esta
 * lo imprescindible para demostrar que el enrutado funciona: una ruta inicial
 * y un destino para todo lo demas.
 */
import type { RouteObject } from 'react-router';

import { DesignSystemPage } from '../pages/DesignSystemPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

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
 * ausencia se comprueba sobre `dist/` como parte de la validacion de
 * `Task/013`.
 *
 * El doble guion bajo del prefijo evita cualquier colision con las rutas
 * reales del MVP (`/articulos`, `/reviews`, `/videos`, `/proyectos`, ...).
 */
const developmentRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: DESIGN_SYSTEM_PATH, element: <DesignSystemPage /> }]
  : [];

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  ...developmentRoutes,
  {
    // Comodin: cualquier ruta no reconocida termina en la pagina 404 en lugar
    // de en una pantalla en blanco. Va el ultimo a proposito: si estuviera
    // antes, absorberia cualquier ruta anadida despues.
    path: '*',
    element: <NotFoundPage />,
  },
];
