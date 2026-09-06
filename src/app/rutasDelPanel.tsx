/**
 * Las dieciocho rutas del panel, **cargadas en diferido**.
 *
 * Cada ruta llega a su componente por `import('../pages/admin')`, un import
 * **dinamico**. Dos consecuencias, y las dos son el requisito **P-05**:
 *
 * 1. Este modulo **no importa nada del panel de forma estatica**, asi que el
 *    grafo de carga inicial del sitio publico no lo arrastra.
 * 2. Como las dieciocho apuntan al **mismo** modulo, Vite emite **un solo
 *    chunk** administrativo en lugar de dieciocho.
 *
 * La estructura de anidamiento tambien es deliberada:
 *
 *     /admin              AdminLayout      ← aqui vive AdminSessionProvider
 *       ├─ acceso         LoginPage        ← **sin** guarda: `login` es publico
 *       └─ (protegidas)   RutaProtegida    ← ruta de layout sin `path`
 *            ├─ index     DashboardPage
 *            ├─ …         las quince superficies restantes
 *            └─ *         AdminNotFoundPage
 *
 * `acceso` cuelga del layout pero **fuera** de la guarda, que es justo lo que
 * `security-boundaries.md` seccion 11.4 describe: `login` es el unico endpoint
 * administrativo publico, y su pagina es la unica ruta del panel sin sesion.
 */
import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';

import { ADMIN } from '../lib/rutasAdmin';

/**
 * Paginas del panel que no reciben props.
 *
 * Se enumeran a mano y no se derivan de `keyof typeof import(...)`: las cuatro
 * paginas de formulario **si** reciben una prop, y aceptarlas aqui las dejaria
 * montarse sin ella.
 */
type PaginaSinProps =
  | 'AdminLayout'
  | 'RutaProtegida'
  | 'LoginPage'
  | 'DashboardPage'
  | 'AdminNotFoundPage'
  | 'PostsAdminPage'
  | 'BookReviewsAdminPage'
  | 'VideosAdminPage'
  | 'ProjectsAdminPage'
  | 'TagsAdminPage'
  | 'MediaAdminPage'
  | 'ProfileAdminPage';

/** Las cuatro paginas de formulario, que necesitan saber si crean o editan. */
type PaginaDeFormulario =
  'PostFormPage' | 'BookReviewFormPage' | 'VideoFormPage' | 'ProjectFormPage';

/**
 * Carga diferida de un componente del panel.
 *
 * `Component` y no `element`: es lo que `lazy` devuelve en un router de datos, y
 * evita construir el elemento antes de que el modulo exista.
 */
function pagina(nombre: PaginaSinProps) {
  return async () => {
    const modulo = await import('../pages/admin');
    return { Component: modulo[nombre] as ComponentType };
  };
}

/** Carga diferida de una pagina de formulario, ya con su modo fijado. */
function formulario(nombre: PaginaDeFormulario, creando: boolean) {
  return async () => {
    const modulo = await import('../pages/admin');
    const Pagina = modulo[nombre];
    const Montada: ComponentType = () => <Pagina creando={creando} />;
    return { Component: Montada };
  };
}

/** Las tres rutas de un tipo publicable: listado, creacion y edicion. */
function rutasDeTipo(
  segmento: string,
  listado: PaginaSinProps,
  form: PaginaDeFormulario,
): RouteObject[] {
  return [
    { path: segmento, lazy: pagina(listado) },
    { path: `${segmento}/nuevo`, lazy: formulario(form, true) },
    /*
     * `:id` **es** la superficie de edicion. No existe un detalle de solo
     * lectura aparte: la edicion es el detalle (decision D-015-A).
     */
    { path: `${segmento}/:id`, lazy: formulario(form, false) },
  ];
}

export const rutasDelPanel: RouteObject[] = [
  {
    path: ADMIN.slice(1),
    lazy: pagina('AdminLayout'),
    children: [
      { path: 'acceso', lazy: pagina('LoginPage') },
      {
        lazy: pagina('RutaProtegida'),
        children: [
          { index: true, lazy: pagina('DashboardPage') },
          ...rutasDeTipo('articulos', 'PostsAdminPage', 'PostFormPage'),
          ...rutasDeTipo('reviews', 'BookReviewsAdminPage', 'BookReviewFormPage'),
          ...rutasDeTipo('videos', 'VideosAdminPage', 'VideoFormPage'),
          ...rutasDeTipo('proyectos', 'ProjectsAdminPage', 'ProjectFormPage'),
          { path: 'etiquetas', lazy: pagina('TagsAdminPage') },
          { path: 'medios', lazy: pagina('MediaAdminPage') },
          { path: 'perfil', lazy: pagina('ProfileAdminPage') },
          /*
           * Comodin **del panel**: una direccion equivocada dentro de `/admin`
           * conserva la navegacion administrativa en lugar de salir al sitio
           * publico. Va el ultimo, como el comodin publico.
           */
          { path: '*', lazy: pagina('AdminNotFoundPage') },
        ],
      },
    ],
  },
];
