/**
 * Tipos del contrato publico del API (`api-contracts.md`, secciones 3, 5 y 12).
 *
 * Son la transcripcion campo a campo de los DTO que el backend expone en
 * `app/modules/<modulo>/presentation/schemas.py` (`Task/009` y `Task/010`). Viven en
 * `services` y no en `entities` porque describen la forma del transporte;
 * `entities` los consume, nunca al reves (`software-architecture.md`, seccion
 * 4.3).
 *
 * Lo que NO aparece aqui, a proposito: `id`, `status`, `object_key`,
 * `created_at`, `updated_at`. El contrato publico no los transporta y el
 * frontend no debe conocerlos.
 */

/** Envoltura de toda coleccion paginada (`api-contracts.md`, seccion 5). */
export interface Pagina<T> {
  readonly items: readonly T[];
  readonly page: number;
  /** Tamano **aplicado**, que puede diferir del pedido si excedia el maximo. */
  readonly page_size: number;
  readonly total: number;
  readonly pages: number;
}

/**
 * Referencia publica a una imagen (`api-contracts.md`, seccion 12).
 *
 * `access_url` es un enlace **temporal** generado al servir la respuesta: no es
 * un identificador estable, no se almacena y no se construye en el cliente.
 */
export interface MedioPublico {
  readonly alt_text: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly access_url: string | null;
}

export interface EtiquetaPublica {
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
}

/** Campos comunes a los cuatro tipos de contenido en un listado. */
export interface ContenidoDeListado {
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  /** Fecha de la primera publicacion, ISO 8601 en UTC. */
  readonly published_at: string | null;
  readonly tags: readonly EtiquetaPublica[];
}

/** Campos que solo viajan en el detalle (decision D-009-P). */
export interface ContenidoDetallado {
  /** Markdown **fuente**, sin renderizar. Se sanitiza en el frontend (ADR-005). */
  readonly content: string;
  readonly reading_time_minutes: number;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
}

export interface PostDeListado extends ContenidoDeListado {
  readonly cover: MedioPublico | null;
}

export interface PostDetallado extends PostDeListado, ContenidoDetallado {}

export interface ReviewDeListado extends PostDeListado {
  readonly book_title: string | null;
  readonly book_author: string | null;
  /** Entero de 1 a 5 (CONTENT_MODEL.md, seccion 3.3). */
  readonly rating: number | null;
}

export interface ReviewDetallada extends ReviewDeListado, ContenidoDetallado {
  readonly external_link: string | null;
}

/** El video **solo** tiene listado: no existe `GET /videos/{slug}`. */
export interface VideoDeListado extends ContenidoDeListado {
  readonly thumbnail: MedioPublico | null;
  readonly provider: string | null;
  readonly video_url: string | null;
  readonly embed_reference: string | null;
  readonly duration_seconds: number | null;
}

/** Marcha del trabajo del proyecto. Ortogonal a su visibilidad. */
export type ProjectWorkStatus = 'active' | 'paused' | 'completed';

export interface ProyectoDeListado extends ContenidoDeListado {
  readonly cover: MedioPublico | null;
  readonly technologies: readonly string[];
  readonly repository_url: string | null;
  readonly demo_url: string | null;
  readonly project_status: ProjectWorkStatus;
}

export interface ProyectoDetallado extends ProyectoDeListado, ContenidoDetallado {}

export interface EnlaceSocialPublico {
  readonly label: string;
  readonly url: string;
}

export interface ProfilePublico {
  readonly full_name: string;
  readonly headline: string | null;
  /** Biografia en Markdown fuente. */
  readonly biography: string;
  readonly contact_email: string | null;
  readonly photo: MedioPublico | null;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
  /** En el orden de presentacion configurado por el autor. */
  readonly social_links: readonly EnlaceSocialPublico[];
}

export type TipoDeContenido = 'post' | 'book_review' | 'video' | 'project';

export interface ResultadoDeBusqueda {
  readonly type: TipoDeContenido;
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly published_at: string | null;
}
