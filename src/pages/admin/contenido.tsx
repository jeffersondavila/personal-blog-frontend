/**
 * Las paginas de contenido: cuatro listados y cuatro formularios.
 *
 * Cada tipo aporta **sus campos**; el ciclo lo pone `PaginaDeContenido`. Los
 * campos propios de cada tipo estan escritos uno a uno y salen del contrato de
 * `Task/012`, no de una plantilla generica:
 *
 * | Tipo | Campos propios | Markdown | Imagen | `unpublish` |
 * | --- | --- | :---: | --- | :---: |
 * | `Post` | — | sí | `cover` | sí |
 * | `BookReview` | libro, autor, valoración, enlace externo | sí | `cover` | sí |
 * | `Video` | proveedor, URL, referencia de *embed*, duración | **no** | `thumbnail` | **no** |
 * | `Project` | marcha, tecnologías, repositorio, demo | sí | `cover` | **no** |
 *
 * **El video no tiene Markdown**, y la ausencia es el contrato: su contenido
 * principal es el video externo (ADR-005, decision 7; `USER_FLOWS.md` B.6). Su
 * cuerpo ni siquiera admite `content`.
 */
import { useCallback } from 'react';

import { useHttpClient } from '../../app/httpClientContext';
import { FormField, Stack } from '../../components';
import { ListadoAdministrativo } from '../../features/admin-content/ListadoAdministrativo';
import { PaginaDeContenido } from '../../features/admin-content/PaginaDeContenido';
import type { ConfiguracionDeTipo } from '../../features/admin-content/PaginaDeContenido';
import { textoOpcional } from '../../features/admin-content/valoresComunes';
import { useCargaAdmin } from '../../features/admin/useCargaAdmin';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useParametrosDeListado } from '../../hooks/useParametrosDeListado';
import { RUTAS_ADMIN } from '../../lib/rutasAdmin';
import type { SeccionDeContenidoAdmin } from '../../lib/rutasAdmin';
import { ARTICULOS, listar, PROYECTOS, REVIEWS, VIDEOS } from '../../services/admin';
import type {
  ArticuloAdministrativo,
  ArticuloParaGuardar,
  EstadoDelProyecto,
  ProyectoAdministrativo,
  ProyectoParaGuardar,
  RecursoDeContenido,
  ReviewAdministrativa,
  ReviewParaGuardar,
  VideoAdministrativo,
  VideoParaGuardar,
} from '../../services/admin';
import { useSearchParams } from 'react-router';

/* --- Listados ------------------------------------------------------------ */

function useListado<R extends { id: string }, C>(recurso: RecursoDeContenido<R, C>) {
  const cliente = useHttpClient();
  const { page } = useParametrosDeListado();
  const [parametros] = useSearchParams();
  const status = parametros.get('status') ?? undefined;

  const cargar = useCallback(
    (signal: AbortSignal) =>
      listar(
        cliente,
        recurso,
        { ...(page ? { page } : {}), ...(status ? { status } : {}) },
        signal,
      ),
    [cliente, recurso, page, status],
  );

  return useCargaAdmin(cargar);
}

function PaginaDeListado<R extends { id: string }, C>({
  titulo,
  seccion,
  recurso,
}: {
  readonly titulo: string;
  readonly seccion: SeccionDeContenidoAdmin;
  readonly recurso: RecursoDeContenido<R, C>;
}) {
  useDocumentTitle(titulo);
  const carga = useListado(recurso);

  return (
    <ListadoAdministrativo
      titulo={titulo}
      seccion={seccion}
      recurso={carga.estado as never}
      onReintentar={carga.reintentar}
    />
  );
}

export function PostsAdminPage() {
  return <PaginaDeListado titulo="Artículos" seccion={RUTAS_ADMIN.articulos} recurso={ARTICULOS} />;
}
export function BookReviewsAdminPage() {
  return <PaginaDeListado titulo="Reviews" seccion={RUTAS_ADMIN.reviews} recurso={REVIEWS} />;
}
export function VideosAdminPage() {
  return <PaginaDeListado titulo="Videos" seccion={RUTAS_ADMIN.videos} recurso={VIDEOS} />;
}
export function ProjectsAdminPage() {
  return <PaginaDeListado titulo="Proyectos" seccion={RUTAS_ADMIN.proyectos} recurso={PROYECTOS} />;
}

/* --- Articulos: sin campos propios --------------------------------------- */

const CONFIG_ARTICULO: ConfiguracionDeTipo<ArticuloAdministrativo, ArticuloParaGuardar, null> = {
  titulo: 'artículo',
  seccion: RUTAS_ADMIN.articulos,
  recurso: ARTICULOS,
  campoDeImagen: 'cover',
  usaMarkdown: true,
  extraInicial: null,
  extraDesdeRespuesta: () => null,
  imagenDesdeRespuesta: (respuesta) => respuesta.cover,
  renderExtras: () => null,
  aCuerpo: ({ comunes, contenido, tagIds, imagenId, altText, imagenYaTieneTexto }) => ({
    title: comunes.title,
    slug: textoOpcional(comunes.slug),
    summary: textoOpcional(comunes.summary),
    content: contenido,
    featured: comunes.featured,
    seo_title: textoOpcional(comunes.seo_title),
    seo_description: textoOpcional(comunes.seo_description),
    cover_id: imagenId,
    tag_ids: tagIds,
    /*
     * El texto solo se envia cuando la imagen **no lo tiene** y hay algo que
     * escribir. Omitirlo en los demas casos es lo que hace que
     * `409 alt_text_conflict` no sea alcanzable desde el panel.
     */
    ...(imagenId !== null && !imagenYaTieneTexto && altText.trim() !== ''
      ? { cover_alt_text: altText.trim() }
      : {}),
  }),
};

export function PostFormPage({ creando }: { readonly creando: boolean }) {
  return <PaginaDeContenido configuracion={CONFIG_ARTICULO} creando={creando} />;
}

/* --- Reviews: libro, autor, valoracion y enlace --------------------------- */

interface ExtraReview {
  readonly book_title: string;
  readonly book_author: string;
  readonly rating: string;
  readonly external_link: string;
}

const CONFIG_REVIEW: ConfiguracionDeTipo<ReviewAdministrativa, ReviewParaGuardar, ExtraReview> = {
  titulo: 'review',
  seccion: RUTAS_ADMIN.reviews,
  recurso: REVIEWS,
  campoDeImagen: 'cover',
  usaMarkdown: true,
  extraInicial: { book_title: '', book_author: '', rating: '', external_link: '' },
  extraDesdeRespuesta: (respuesta) => ({
    book_title: respuesta.book_title ?? '',
    book_author: respuesta.book_author ?? '',
    rating: respuesta.rating === null ? '' : String(respuesta.rating),
    external_link: respuesta.external_link ?? '',
  }),
  imagenDesdeRespuesta: (respuesta) => respuesta.cover,
  renderExtras: (extra, cambiar) => (
    <Stack gap="md">
      <FormField label="Título del libro">
        {(atributos) => (
          <input
            {...atributos}
            type="text"
            value={extra.book_title}
            onChange={(evento) => {
              cambiar({ ...extra, book_title: evento.target.value });
            }}
          />
        )}
      </FormField>
      <FormField label="Autor del libro">
        {(atributos) => (
          <input
            {...atributos}
            type="text"
            value={extra.book_author}
            onChange={(evento) => {
              cambiar({ ...extra, book_author: evento.target.value });
            }}
          />
        )}
      </FormField>
      <FormField
        label="Valoración"
        descripcion="Del 1 al 5. Hace falta para poder publicar la review."
      >
        {(atributos) => (
          <select
            {...atributos}
            value={extra.rating}
            onChange={(evento) => {
              cambiar({ ...extra, rating: evento.target.value });
            }}
          >
            <option value="">Sin valoración</option>
            {[1, 2, 3, 4, 5].map((valor) => (
              <option key={valor} value={String(valor)}>
                {valor} de 5
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField label="Enlace externo">
        {(atributos) => (
          <input
            {...atributos}
            type="url"
            value={extra.external_link}
            onChange={(evento) => {
              cambiar({ ...extra, external_link: evento.target.value });
            }}
          />
        )}
      </FormField>
    </Stack>
  ),
  aCuerpo: ({ comunes, extra, contenido, tagIds, imagenId, altText, imagenYaTieneTexto }) => ({
    title: comunes.title,
    slug: textoOpcional(comunes.slug),
    summary: textoOpcional(comunes.summary),
    content: contenido,
    featured: comunes.featured,
    seo_title: textoOpcional(comunes.seo_title),
    seo_description: textoOpcional(comunes.seo_description),
    cover_id: imagenId,
    tag_ids: tagIds,
    book_title: textoOpcional(extra.book_title),
    book_author: textoOpcional(extra.book_author),
    rating: extra.rating === '' ? null : Number(extra.rating),
    external_link: textoOpcional(extra.external_link),
    ...(imagenId !== null && !imagenYaTieneTexto && altText.trim() !== ''
      ? { cover_alt_text: altText.trim() }
      : {}),
  }),
};

export function BookReviewFormPage({ creando }: { readonly creando: boolean }) {
  return <PaginaDeContenido configuracion={CONFIG_REVIEW} creando={creando} />;
}

/* --- Videos: sin Markdown, con miniatura ---------------------------------- */

interface ExtraVideo {
  readonly provider: string;
  readonly video_url: string;
  readonly embed_reference: string;
  readonly duration_seconds: string;
}

/**
 * Proveedores que el sitio publico sabe incrustar (`Task/014`, **D-014-C**).
 *
 * El backend **solo exige presencia**, no pertenencia (`api-contracts.md`
 * seccion 14.5); ofrecer aqui la lista cerrada es exactamente la deuda que
 * `Task/014` dejo anotada para el panel. Se conserva «otro» porque el contrato
 * admite cualquier cadena y ocultarlo impediria editar un video existente.
 */
const PROVEEDORES = ['youtube', 'vimeo'] as const;

const CONFIG_VIDEO: ConfiguracionDeTipo<VideoAdministrativo, VideoParaGuardar, ExtraVideo> = {
  titulo: 'video',
  seccion: RUTAS_ADMIN.videos,
  recurso: VIDEOS,
  campoDeImagen: 'thumbnail',
  usaMarkdown: false,
  extraInicial: { provider: '', video_url: '', embed_reference: '', duration_seconds: '' },
  extraDesdeRespuesta: (respuesta) => ({
    provider: respuesta.provider ?? '',
    video_url: respuesta.video_url ?? '',
    embed_reference: respuesta.embed_reference ?? '',
    duration_seconds: respuesta.duration_seconds === null ? '' : String(respuesta.duration_seconds),
  }),
  imagenDesdeRespuesta: (respuesta) => respuesta.thumbnail,
  renderExtras: (extra, cambiar) => (
    <Stack gap="md">
      <FormField
        label="Proveedor"
        descripcion="El sitio público solo incrusta YouTube y Vimeo; el resto se ofrece como enlace."
      >
        {(atributos) => (
          <select
            {...atributos}
            value={extra.provider}
            onChange={(evento) => {
              cambiar({ ...extra, provider: evento.target.value });
            }}
          >
            <option value="">Sin proveedor</option>
            {PROVEEDORES.map((proveedor) => (
              <option key={proveedor} value={proveedor}>
                {proveedor}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField label="URL del video">
        {(atributos) => (
          <input
            {...atributos}
            type="url"
            value={extra.video_url}
            onChange={(evento) => {
              cambiar({ ...extra, video_url: evento.target.value });
            }}
          />
        )}
      </FormField>
      <FormField label="Referencia de embed" descripcion="Identificador del video en el proveedor.">
        {(atributos) => (
          <input
            {...atributos}
            type="text"
            value={extra.embed_reference}
            onChange={(evento) => {
              cambiar({ ...extra, embed_reference: evento.target.value });
            }}
          />
        )}
      </FormField>
      <FormField label="Duración en segundos">
        {(atributos) => (
          <input
            {...atributos}
            type="number"
            min={1}
            value={extra.duration_seconds}
            onChange={(evento) => {
              cambiar({ ...extra, duration_seconds: evento.target.value });
            }}
          />
        )}
      </FormField>
    </Stack>
  ),
  aCuerpo: ({ comunes, extra, tagIds, imagenId, altText, imagenYaTieneTexto }) => ({
    title: comunes.title,
    slug: textoOpcional(comunes.slug),
    summary: textoOpcional(comunes.summary),
    featured: comunes.featured,
    seo_title: textoOpcional(comunes.seo_title),
    seo_description: textoOpcional(comunes.seo_description),
    thumbnail_id: imagenId,
    tag_ids: tagIds,
    provider: textoOpcional(extra.provider),
    video_url: textoOpcional(extra.video_url),
    embed_reference: textoOpcional(extra.embed_reference),
    duration_seconds: extra.duration_seconds === '' ? null : Number(extra.duration_seconds),
    ...(imagenId !== null && !imagenYaTieneTexto && altText.trim() !== ''
      ? { thumbnail_alt_text: altText.trim() }
      : {}),
  }),
};

export function VideoFormPage({ creando }: { readonly creando: boolean }) {
  return <PaginaDeContenido configuracion={CONFIG_VIDEO} creando={creando} />;
}

/* --- Proyectos: marcha del trabajo, tecnologias y enlaces ----------------- */

interface ExtraProyecto {
  readonly project_status: EstadoDelProyecto;
  readonly technologies: string;
  readonly repository_url: string;
  readonly demo_url: string;
}

const MARCHA: readonly { readonly valor: EstadoDelProyecto; readonly texto: string }[] = [
  { valor: 'active', texto: 'Activo' },
  { valor: 'paused', texto: 'En pausa' },
  { valor: 'completed', texto: 'Terminado' },
];

const CONFIG_PROYECTO: ConfiguracionDeTipo<
  ProyectoAdministrativo,
  ProyectoParaGuardar,
  ExtraProyecto
> = {
  titulo: 'proyecto',
  seccion: RUTAS_ADMIN.proyectos,
  recurso: PROYECTOS,
  campoDeImagen: 'cover',
  usaMarkdown: true,
  extraInicial: { project_status: 'active', technologies: '', repository_url: '', demo_url: '' },
  extraDesdeRespuesta: (respuesta) => ({
    project_status: respuesta.project_status,
    technologies: respuesta.technologies.join(', '),
    repository_url: respuesta.repository_url ?? '',
    demo_url: respuesta.demo_url ?? '',
  }),
  imagenDesdeRespuesta: (respuesta) => respuesta.cover,
  renderExtras: (extra, cambiar) => (
    <Stack gap="md">
      <FormField
        label="Marcha del trabajo"
        descripcion="No es el estado de publicación: son conceptos distintos."
      >
        {(atributos) => (
          <select
            {...atributos}
            value={extra.project_status}
            onChange={(evento) => {
              cambiar({ ...extra, project_status: evento.target.value as EstadoDelProyecto });
            }}
          >
            {MARCHA.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField label="Tecnologías" descripcion="Separadas por comas.">
        {(atributos) => (
          <input
            {...atributos}
            type="text"
            value={extra.technologies}
            onChange={(evento) => {
              cambiar({ ...extra, technologies: evento.target.value });
            }}
          />
        )}
      </FormField>
      <FormField label="Repositorio">
        {(atributos) => (
          <input
            {...atributos}
            type="url"
            value={extra.repository_url}
            onChange={(evento) => {
              cambiar({ ...extra, repository_url: evento.target.value });
            }}
          />
        )}
      </FormField>
      <FormField label="Demo">
        {(atributos) => (
          <input
            {...atributos}
            type="url"
            value={extra.demo_url}
            onChange={(evento) => {
              cambiar({ ...extra, demo_url: evento.target.value });
            }}
          />
        )}
      </FormField>
    </Stack>
  ),
  aCuerpo: ({ comunes, extra, contenido, tagIds, imagenId, altText, imagenYaTieneTexto }) => ({
    title: comunes.title,
    slug: textoOpcional(comunes.slug),
    summary: textoOpcional(comunes.summary),
    content: contenido,
    featured: comunes.featured,
    seo_title: textoOpcional(comunes.seo_title),
    seo_description: textoOpcional(comunes.seo_description),
    cover_id: imagenId,
    tag_ids: tagIds,
    project_status: extra.project_status,
    /* No se normaliza ni se deduplica: cambiaria lo que el administrador escribio. */
    technologies: extra.technologies
      .split(',')
      .map((valor) => valor.trim())
      .filter((valor) => valor !== ''),
    repository_url: textoOpcional(extra.repository_url),
    demo_url: textoOpcional(extra.demo_url),
    ...(imagenId !== null && !imagenYaTieneTexto && altText.trim() !== ''
      ? { cover_alt_text: altText.trim() }
      : {}),
  }),
};

export function ProjectFormPage({ creando }: { readonly creando: boolean }) {
  return <PaginaDeContenido configuracion={CONFIG_PROYECTO} creando={creando} />;
}
