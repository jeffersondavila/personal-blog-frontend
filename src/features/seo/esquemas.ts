/**
 * Datos estructurados JSON-LD (`Task/016`, requisito E-07).
 *
 * La regla que gobierna este modulo entero
 * ----------------------------------------
 *
 * **Ninguna propiedad se emite si el DTO publico real no la alimenta.** Un
 * JSON-LD con datos inventados no es un adorno inofensivo: afirma ante un
 * buscador algo que el sitio no sabe. Cada constructor es *fail-closed*: si falta
 * un campo obligatorio del esquema, devuelve `null` y no se emite nada.
 *
 * Lo que hace esto viable es una garantia del contrato: `api-contracts.md` §14.5
 * exige, **al publicar**, `title`, `slug` y una descripcion SEO resoluble
 * (`seo_description` **o** `summary`), y para una review ademas `book_title`,
 * `book_author` y `rating`. Todo contenido publicado trae lo que estos esquemas
 * necesitan.
 *
 * Dos ausencias deliberadas, con su motivo
 * ---------------------------------------
 *
 * - **`image`.** La unica imagen de un contenido es su portada, accesible solo
 *   por `access_url`, que **caduca** (900 s por defecto). Publicarla en un dato
 *   estructurado que un buscador leera dias despues contradice la regla vigente
 *   de **D-08**. El *rich result* completo de articulo depende por tanto de que
 *   `Task/030` resuelva D-08 — bloqueo **B-016-1**.
 * - **`dateModified`.** `updated_at` existe en la base de datos pero **no** en el
 *   DTO publico, y esta tarea no amplia el contrato para un dato que ninguna
 *   fuente canonica pide.
 *
 * Que NO se emite, y por que
 * --------------------------
 *
 * - `VideoObject`: exigiria `contentUrl`/`embedUrl` mas `thumbnailUrl` y
 *   `uploadDate`; la miniatura solo existe como enlace caducable y no hay pagina
 *   de detalle de video.
 * - `SoftwareApplication` para proyectos: ninguna fuente lo pide y el DTO no trae
 *   los campos que el tipo espera.
 * - `Organization`: el sitio es una persona, no una organizacion.
 * - `ItemList`/`CollectionPage` en los listados: obligarian a decidir como se
 *   representa la paginacion, y no aportan nada que el usuario pida.
 */
import type {
  PostDetallado,
  ProfilePublico,
  ProyectoDetallado,
  ReviewDetallada,
} from '../../services/public/types';
import { NOMBRE_DEL_SITIO } from '../../lib/site';
import { RUTAS } from '../../lib/rutas';
import { textoNoVacio, urlAbsoluta } from './metadatos';

/** Un esquema JSON-LD ya construido, sin el `@context`, que anade `Seo`. */
export type Esquema = Record<string, unknown>;

/** Escala de valoracion de una review: **decision D-D** de `data-model.md`. */
const VALORACION_MINIMA = 1;
const VALORACION_MAXIMA = 5;

/** `WebSite` de la portada, con la accion de busqueda que el sitio si tiene. */
export function esquemaDelSitio(origen: string): Esquema {
  return {
    '@type': 'WebSite',
    name: NOMBRE_DEL_SITIO,
    url: urlAbsoluta(origen, '/'),
    potentialAction: {
      '@type': 'SearchAction',
      // La plantilla apunta a la ruta que existe de verdad (`RUTAS.buscar`), no
      // a una convencion inventada.
      target: `${urlAbsoluta(origen, RUTAS.buscar)}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * `Person` de la pagina Quien soy.
 *
 * Sin perfil no se emite: `GET /profile` responde `404` mientras no haya semilla
 * (**D-009-N**), y una persona sin nombre no es un dato, es un hueco.
 *
 * **No** se emite `jobTitle`: `headline` es un lema del sitio, no un cargo, y
 * mapearlo a `jobTitle` seria afirmar algo que el modelo no dice.
 */
export function esquemaDePersona(perfil: ProfilePublico | null, origen: string): Esquema | null {
  if (perfil === null) {
    return null;
  }
  const nombre = textoNoVacio(perfil.full_name);
  if (nombre === null) {
    return null;
  }

  const descripcion = textoNoVacio(perfil.seo_description) ?? textoNoVacio(perfil.headline);
  const redes = perfil.social_links.map((enlace) => enlace.url).filter((url) => url.trim() !== '');

  return {
    '@type': 'Person',
    name: nombre,
    url: urlAbsoluta(origen, RUTAS.quienSoy),
    ...(descripcion !== null ? { description: descripcion } : {}),
    ...(redes.length > 0 ? { sameAs: redes } : {}),
  };
}

interface ContenidoDeArticulo {
  readonly title: string;
  readonly seo_description: string | null;
  readonly summary: string | null;
  readonly published_at: string | null;
  readonly tags: readonly { readonly name: string }[];
}

/** `Article` de un detalle de articulo o de proyecto. */
export function esquemaDeArticulo({
  contenido,
  url,
}: {
  readonly contenido: PostDetallado | ProyectoDetallado | ContenidoDeArticulo;
  readonly url: string;
}): Esquema | null {
  const titular = textoNoVacio(contenido.title);
  if (titular === null) {
    return null;
  }

  const descripcion = textoNoVacio(contenido.seo_description) ?? textoNoVacio(contenido.summary);
  const etiquetas = contenido.tags.map((etiqueta) => etiqueta.name).filter((n) => n.trim() !== '');

  return {
    '@type': 'Article',
    headline: titular,
    mainEntityOfPage: url,
    ...(descripcion !== null ? { description: descripcion } : {}),
    ...(contenido.published_at !== null ? { datePublished: contenido.published_at } : {}),
    ...(etiquetas.length > 0 ? { keywords: etiquetas.join(', ') } : {}),
  };
}

/**
 * `Review` de un `Book`.
 *
 * *Fail-closed*: si falta el titulo del libro, su autor o la valoracion, **no se
 * emite nada**. En contenido publicado los tres estan garantizados
 * (`api-contracts.md` §14.5), asi que este camino solo se recorre ante un dato
 * defectuoso — y ante eso, callar es lo correcto.
 */
export function esquemaDeReview({
  contenido,
  url,
}: {
  readonly contenido: ReviewDetallada;
  readonly url: string;
}): Esquema | null {
  const tituloDelLibro = textoNoVacio(contenido.book_title);
  const autorDelLibro = textoNoVacio(contenido.book_author);
  const valoracion = contenido.rating;

  if (tituloDelLibro === null || autorDelLibro === null || valoracion === null) {
    return null;
  }

  const cuerpo = textoNoVacio(contenido.seo_description) ?? textoNoVacio(contenido.summary);

  return {
    '@type': 'Review',
    mainEntityOfPage: url,
    itemReviewed: {
      '@type': 'Book',
      name: tituloDelLibro,
      author: { '@type': 'Person', name: autorDelLibro },
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: valoracion,
      // La escala no se inventa: es la decision **D-D** de `data-model.md`,
      // entero 1..5, y esta impuesta por un `CHECK` en la base de datos.
      bestRating: VALORACION_MAXIMA,
      worstRating: VALORACION_MINIMA,
    },
    ...(cuerpo !== null ? { reviewBody: cuerpo } : {}),
    ...(contenido.published_at !== null ? { datePublished: contenido.published_at } : {}),
  };
}

export interface Miga {
  readonly nombre: string;
  readonly url: string;
}

/** `BreadcrumbList` a partir de la jerarquia real de rutas. */
export function esquemaDeMigasDePan(migas: readonly Miga[]): Esquema {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: migas.map((miga, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      name: miga.nombre,
      item: miga.url,
    })),
  };
}
