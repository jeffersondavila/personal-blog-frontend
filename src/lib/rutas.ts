/**
 * Rutas del sitio publico, confirmadas en `Task/014` (decision D-014-A) a
 * partir de la propuesta de `MVP_SCOPE.md`, seccion 2.1.
 *
 * Viven en `lib` y no en `app` porque las consumen las entidades —una
 * etiqueta enlaza al listado filtrado de su tipo, un resultado de busqueda al
 * detalle— y `entities` no puede importar de `app`
 * (`software-architecture.md`, seccion 4.3).
 *
 * **No existe** ruta de detalle de video: el contrato no tiene
 * `GET /videos/{slug}`. Un resultado de busqueda de tipo `video` lleva al
 * listado con un ancla a la tarjeta (decision D-014-J).
 */
import type { TipoDeContenido } from '../services/public/types';

export const RUTAS = {
  inicio: '/',
  quienSoy: '/quien-soy',
  articulos: '/articulos',
  reviews: '/reviews',
  videos: '/videos',
  proyectos: '/proyectos',
  contacto: '/contacto',
  buscar: '/buscar',
} as const;

/** Listados que admiten filtro por etiqueta (USER_FLOWS A.9). */
export type SeccionDeContenido =
  typeof RUTAS.articulos | typeof RUTAS.reviews | typeof RUTAS.videos | typeof RUTAS.proyectos;

/** Secciones principales, en el orden de la navegacion (MVP_SCOPE seccion 2.1). */
export const SECCIONES: readonly { readonly ruta: string; readonly nombre: string }[] = [
  { ruta: RUTAS.articulos, nombre: 'Artículos' },
  { ruta: RUTAS.reviews, nombre: 'Reviews' },
  { ruta: RUTAS.videos, nombre: 'Videos' },
  { ruta: RUTAS.proyectos, nombre: 'Proyectos' },
  { ruta: RUTAS.quienSoy, nombre: 'Quién soy' },
  { ruta: RUTAS.contacto, nombre: 'Contacto' },
];

/** Ruta del listado filtrado por una etiqueta. */
export function rutaDeEtiqueta(seccion: SeccionDeContenido, slug: string): string {
  return `${seccion}?tag=${encodeURIComponent(slug)}`;
}

/** Destino publico de un contenido segun su tipo. */
export function rutaDeContenido(tipo: TipoDeContenido, slug: string): string {
  const codificado = encodeURIComponent(slug);
  switch (tipo) {
    case 'post':
      return `${RUTAS.articulos}/${codificado}`;
    case 'book_review':
      return `${RUTAS.reviews}/${codificado}`;
    case 'project':
      return `${RUTAS.proyectos}/${codificado}`;
    case 'video':
      // Sin detalle: ancla a la tarjeta dentro del listado (D-014-J).
      return `${RUTAS.videos}#${codificado}`;
  }
}
