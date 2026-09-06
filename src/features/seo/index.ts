/**
 * Superficie publica de los metadatos SEO (`Task/016`).
 *
 * Las paginas importan de aqui y no de los modulos internos, igual que hacen con
 * `src/components`.
 */
export { Seo, type SeoProps, type TipoOpenGraph } from './Seo';
export { NoIndex } from './NoIndex';
export {
  ALT_DE_LA_IMAGEN_OG,
  ALTO_DE_LA_IMAGEN_OG,
  ANCHO_DE_LA_IMAGEN_OG,
  DESCRIPCION_DE_ARTICULOS,
  DESCRIPCION_DE_CONTACTO,
  DESCRIPCION_DE_LA_BUSQUEDA,
  DESCRIPCION_DE_LA_404,
  DESCRIPCION_DE_PROYECTOS,
  DESCRIPCION_DE_QUIEN_SOY,
  DESCRIPCION_DE_REVIEWS,
  DESCRIPCION_DE_VIDEOS,
  DESCRIPCION_DEL_SITIO,
  RUTA_DE_LA_IMAGEN_OG,
  textoNoVacio,
  urlAbsoluta,
} from './metadatos';
export {
  esquemaDeArticulo,
  esquemaDeMigasDePan,
  esquemaDePersona,
  esquemaDeReview,
  esquemaDelSitio,
  type Esquema,
  type Miga,
} from './esquemas';
