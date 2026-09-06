/**
 * Tipos del contrato **administrativo** (`api-contracts.md` secciones 13, 14 y 15).
 *
 * Transcripcion campo a campo de los DTO que el backend expone en
 * `app/modules/<modulo>/presentation/schemas_admin.py` (`Task/011`, `Task/012` y
 * `Task/012.1`). Viven en `services` porque describen el transporte;
 * `features` y `pages` los consumen, nunca al reves
 * (`software-architecture.md` seccion 4.3).
 *
 * Lo que **no** aparece aqui, a proposito, porque el contrato no lo transporta:
 * `object_key`, `is_singleton`, `cover_id`/`photo_id`/`thumbnail_id` en las
 * respuestas, `password_hash`, y —en el historial— `actor_id`,
 * `event_metadata`, `request_id` e `ip_address`.
 */
import type { EtiquetaPublica, Pagina } from '../public/types';

export type { EtiquetaPublica, Pagina };

/** Los tres estados oficiales del contenido (`MVP_SCOPE.md` seccion 3.2). */
export type EstadoDePublicacion = 'draft' | 'published' | 'archived';

/** Marcha del trabajo de un proyecto. **No** es el estado de publicacion. */
export type EstadoDelProyecto = 'active' | 'paused' | 'completed';

/**
 * Identidad del administrador autenticado (`api-contracts.md` seccion 13.2).
 *
 * Son **exactamente** estos tres campos. La credencial de sesion no aparece en
 * ningun cuerpo: viaja solo en la cookie `HttpOnly`.
 */
export interface AdministradorAutenticado {
  readonly id: string;
  readonly email: string;
  readonly display_name: string;
}

/**
 * Imagen tal como la ve el panel (`api-contracts.md` seccion 14.7).
 *
 * Incluye los cuatro campos de `MedioPublico`, asi que sirve directamente a
 * `MediaImage`. `access_url` es un **enlace temporal**: se muestra, nunca se
 * almacena ni se persiste como dato de negocio.
 */
export interface MedioAdministrativo {
  readonly id: string;
  readonly original_filename: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly alt_text: string | null;
  readonly checksum: string | null;
  readonly created_at: string;
  readonly access_url: string | null;
}

/** Campos comunes de los cuatro tipos publicables en una respuesta. */
interface ContenidoAdministrativo {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly status: EstadoDePublicacion;
  readonly published_at: string | null;
  readonly featured: boolean;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
  readonly tags: readonly EtiquetaPublica[];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ArticuloAdministrativo extends ContenidoAdministrativo {
  readonly content: string;
  readonly cover: MedioAdministrativo | null;
}

export interface ReviewAdministrativa extends ArticuloAdministrativo {
  readonly book_title: string | null;
  readonly book_author: string | null;
  readonly rating: number | null;
  readonly external_link: string | null;
}

/** **Sin `content`**, y la ausencia es el contrato (ADR-005, decision 7). */
export interface VideoAdministrativo extends ContenidoAdministrativo {
  readonly thumbnail: MedioAdministrativo | null;
  readonly provider: string | null;
  readonly video_url: string | null;
  readonly embed_reference: string | null;
  readonly duration_seconds: number | null;
}

export interface ProyectoAdministrativo extends ArticuloAdministrativo {
  readonly project_status: EstadoDelProyecto;
  readonly technologies: readonly string[];
  readonly repository_url: string | null;
  readonly demo_url: string | null;
}

export interface EtiquetaAdministrativa {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface EnlaceSocial {
  readonly label: string;
  readonly url: string;
}

export interface PerfilAdministrativo {
  readonly id: string;
  readonly full_name: string;
  readonly headline: string | null;
  readonly biography: string;
  readonly contact_email: string | null;
  readonly photo: MedioAdministrativo | null;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
  readonly social_links: readonly EnlaceSocial[];
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Un evento del historial (`api-contracts.md` seccion 15.3).
 *
 * **Cinco campos, y solo cinco.** El contrato `v1` no transporta `actor_id`,
 * `event_metadata`, `request_id` ni `ip_address`, asi que el panel **no puede**
 * mostrar autor, contexto, correlation ID ni IP de un evento. No se inventan ni
 * se piden por otra via.
 */
export interface EventoDeAuditoria {
  readonly id: string;
  readonly occurred_at: string;
  readonly action: string;
  readonly entity_type: string;
  /** Nulo en los eventos de sesion, que no afectan a ningun elemento. */
  readonly entity_id: string | null;
}

/* --- Cuerpos de escritura ------------------------------------------------ */

/**
 * Campos comunes de escritura.
 *
 * `status` y `published_at` **no estan y no pueden estar**: no son escribibles
 * (decision **D-012-A**) y el backend responde `422` si se envian, porque sus
 * esquemas usan `extra="forbid"`.
 */
interface ContenidoParaGuardar {
  readonly title: string;
  readonly slug?: string | null;
  readonly summary?: string | null;
  readonly featured: boolean;
  readonly seo_title?: string | null;
  readonly seo_description?: string | null;
  readonly tag_ids: readonly string[];
}

export interface ArticuloParaGuardar extends ContenidoParaGuardar {
  readonly content: string;
  readonly cover_id?: string | null;
  /** Solo se envia junto a `cover_id`, y solo si la imagen aun no tiene texto. */
  readonly cover_alt_text?: string;
}

export interface ReviewParaGuardar extends ArticuloParaGuardar {
  readonly book_title?: string | null;
  readonly book_author?: string | null;
  readonly rating?: number | null;
  readonly external_link?: string | null;
}

export interface VideoParaGuardar extends ContenidoParaGuardar {
  readonly thumbnail_id?: string | null;
  readonly thumbnail_alt_text?: string;
  readonly provider?: string | null;
  readonly video_url?: string | null;
  readonly embed_reference?: string | null;
  readonly duration_seconds?: number | null;
}

export interface ProyectoParaGuardar extends ArticuloParaGuardar {
  readonly project_status: EstadoDelProyecto;
  readonly technologies: readonly string[];
  readonly repository_url?: string | null;
  readonly demo_url?: string | null;
}

export interface EtiquetaParaCrear {
  readonly name: string;
  readonly slug?: string | null;
  readonly description?: string | null;
}

/** **Sin `slug`**: el de una etiqueta es inmutable (decision **D-012-S**). */
export interface EtiquetaParaRenombrar {
  readonly name: string;
  readonly description?: string | null;
}

export interface PerfilParaGuardar {
  readonly full_name: string;
  readonly headline?: string | null;
  readonly biography: string;
  readonly contact_email?: string | null;
  readonly photo_id?: string | null;
  readonly photo_alt_text?: string;
  readonly seo_title?: string | null;
  readonly seo_description?: string | null;
  readonly social_links: readonly EnlaceSocial[];
}
