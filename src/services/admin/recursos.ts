/**
 * Los cuatro recursos publicables, declarados una vez.
 *
 * `admiteDespublicar` no es una preferencia de interfaz: es el contrato.
 * `api-contracts.md` seccion 14.2 y `MVP_SCOPE.md` seccion 3.2 dicen que
 * `published → draft` existe para articulos y reviews y **no** para videos ni
 * proyectos, y que en esos dos la ruta sencillamente no esta en OpenAPI.
 */
import type { RecursoDeContenido } from './contenido';
import type {
  ArticuloAdministrativo,
  ArticuloParaGuardar,
  ProyectoAdministrativo,
  ProyectoParaGuardar,
  ReviewAdministrativa,
  ReviewParaGuardar,
  VideoAdministrativo,
  VideoParaGuardar,
} from './types';

export const ARTICULOS: RecursoDeContenido<ArticuloAdministrativo, ArticuloParaGuardar> = {
  ruta: 'posts',
  admiteDespublicar: true,
};

export const REVIEWS: RecursoDeContenido<ReviewAdministrativa, ReviewParaGuardar> = {
  ruta: 'book-reviews',
  admiteDespublicar: true,
};

export const VIDEOS: RecursoDeContenido<VideoAdministrativo, VideoParaGuardar> = {
  ruta: 'videos',
  admiteDespublicar: false,
};

export const PROYECTOS: RecursoDeContenido<ProyectoAdministrativo, ProyectoParaGuardar> = {
  ruta: 'projects',
  admiteDespublicar: false,
};

/** Los cuatro, en el orden en que el panel los presenta. */
export const RECURSOS_PUBLICABLES = [ARTICULOS, REVIEWS, VIDEOS, PROYECTOS] as const;
