/**
 * Tabla de rutas de la aplicacion.
 *
 * Se define como datos —un `RouteObject[]`— en lugar de construir el router
 * aqui. Asi la misma tabla alimenta el router de navegador en produccion y un
 * router en memoria en las pruebas, y no existe la posibilidad de que lo que
 * se prueba y lo que se sirve diverjan.
 *
 * Las rutas del blog —articulos, reviews, videos, proyectos, contacto— y las
 * del panel administrativo llegan en `Task/013`, `Task/014` y `Task/015`. Aqui
 * solo esta lo imprescindible para demostrar que el enrutado funciona: una
 * ruta inicial y un destino para todo lo demas.
 */
import type { RouteObject } from 'react-router';

import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    // Comodin: cualquier ruta no reconocida termina en la pagina 404 en lugar
    // de en una pantalla en blanco.
    path: '*',
    element: <NotFoundPage />,
  },
];
