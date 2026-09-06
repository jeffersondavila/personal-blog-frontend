/**
 * Rutas del panel administrativo, confirmadas en `Task/015` (decision
 * **D-015-A**) a partir de `MVP_SCOPE.md` seccion 3.1 y `USER_FLOWS.md` parte B.
 *
 * Ninguna fuente canonica las fijaba: `MVP_SCOPE.md` seccion 2.1 solo enumera
 * las publicas y B.1 dice *"abre la ruta de acceso al panel"* sin nombrarla. Se
 * escriben en espanol, como las publicas (`Task/014`, D-014-A), bajo el prefijo
 * `/admin` que el requisito **E-06** ya usa para nombrar al panel.
 *
 * Dos espacios de nombres que empiezan igual y **no deben confundirse**:
 *
 * | Forma | Que es |
 * | --- | --- |
 * | `/admin/articulos` | **Ruta del panel**, en espanol. Esta aqui |
 * | `/api/v1/admin/posts` | **Path HTTP** del contrato, en ingles. Vive en `services/admin` |
 *
 * Viven en `lib` y no en `app` por la misma razon que `rutas.ts`: las consumen
 * paginas y features, y `software-architecture.md` seccion 4.3 no permite que
 * esas capas importen de `app`.
 */

/** Prefijo del panel. Lo comparten todas las rutas de este modulo. */
export const ADMIN = '/admin';

export const RUTAS_ADMIN = {
  acceso: `${ADMIN}/acceso`,
  panel: ADMIN,
  articulos: `${ADMIN}/articulos`,
  reviews: `${ADMIN}/reviews`,
  videos: `${ADMIN}/videos`,
  proyectos: `${ADMIN}/proyectos`,
  etiquetas: `${ADMIN}/etiquetas`,
  medios: `${ADMIN}/medios`,
  perfil: `${ADMIN}/perfil`,
} as const;

/** Los cuatro tipos publicables, tal como los nombra el panel. */
export type SeccionDeContenidoAdmin =
  | typeof RUTAS_ADMIN.articulos
  | typeof RUTAS_ADMIN.reviews
  | typeof RUTAS_ADMIN.videos
  | typeof RUTAS_ADMIN.proyectos;

/** Secciones de la navegacion del panel, en orden. */
export const SECCIONES_ADMIN: readonly { readonly ruta: string; readonly nombre: string }[] = [
  { ruta: RUTAS_ADMIN.panel, nombre: 'Panel' },
  { ruta: RUTAS_ADMIN.articulos, nombre: 'Artículos' },
  { ruta: RUTAS_ADMIN.reviews, nombre: 'Reviews' },
  { ruta: RUTAS_ADMIN.videos, nombre: 'Videos' },
  { ruta: RUTAS_ADMIN.proyectos, nombre: 'Proyectos' },
  { ruta: RUTAS_ADMIN.etiquetas, nombre: 'Etiquetas' },
  { ruta: RUTAS_ADMIN.medios, nombre: 'Medios' },
  { ruta: RUTAS_ADMIN.perfil, nombre: 'Perfil' },
];

/** Ruta de creacion de un tipo de contenido. */
export function rutaDeCreacion(seccion: SeccionDeContenidoAdmin): string {
  return `${seccion}/nuevo`;
}

/**
 * Ruta de edicion de un elemento.
 *
 * **No existe un detalle administrativo aparte de la edicion**: la edicion *es*
 * el detalle, y crear una vista de solo lectura duplicaria la superficie sin que
 * ninguna fuente la pida.
 */
export function rutaDeEdicion(seccion: SeccionDeContenidoAdmin, id: string): string {
  return `${seccion}/${encodeURIComponent(id)}`;
}

/**
 * Decide si un destino puede usarse como retorno tras iniciar sesion.
 *
 * Solo se acepta una ruta **interna del panel**. Es la guarda contra la
 * redireccion abierta: un destino que empiece por `http://`, `https://` o `//`
 * apunta a otro sitio, y uno que no empiece por `/admin` sacaria al
 * administrador del panel al que acaba de entrar.
 *
 * El destino viaja en el **estado del router**, nunca en la URL ni en
 * `localStorage`: un `?next=` compartible es precisamente el vector que esta
 * funcion existe para cerrar.
 */
export function esDestinoInternoDelPanel(destino: unknown): destino is string {
  return typeof destino === 'string' && (destino === ADMIN || destino.startsWith(`${ADMIN}/`));
}
