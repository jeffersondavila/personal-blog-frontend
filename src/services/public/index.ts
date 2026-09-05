/**
 * Superficie publica de los adaptadores del API publico (`Task/014`).
 *
 * Igual que `services/http`: el resto de la aplicacion importa desde aqui, no
 * de los archivos internos. Solo `GET`; solo los diez recursos publicos del
 * contrato. Ningun adaptador administrativo vive aqui ni debe vivir: el sitio
 * publico es anonimo (`MVP_SCOPE.md`, seccion 2.3).
 */
export { fetchBookReview, fetchBookReviews } from './bookReviews';
export type { ParametrosDeListado } from './listado';
export { fetchPost, fetchPosts } from './posts';
export { fetchProfile } from './profile';
export { fetchProject, fetchProjects } from './projects';
export {
  fetchSearch,
  LONGITUD_MAXIMA_DE_BUSQUEDA,
  LONGITUD_MINIMA_DE_BUSQUEDA,
  normalizarTermino,
} from './search';
export type { ParametrosDeBusqueda } from './search';
export { fetchTags } from './tags';
export type {
  ContenidoDeListado,
  ContenidoDetallado,
  EnlaceSocialPublico,
  EtiquetaPublica,
  MedioPublico,
  Pagina,
  PostDeListado,
  PostDetallado,
  ProfilePublico,
  ProjectWorkStatus,
  ProyectoDeListado,
  ProyectoDetallado,
  ResultadoDeBusqueda,
  ReviewDeListado,
  ReviewDetallada,
  TipoDeContenido,
  VideoDeListado,
} from './types';
export { fetchVideos } from './videos';
