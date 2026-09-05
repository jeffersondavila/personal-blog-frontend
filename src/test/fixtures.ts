/**
 * Datos de ejemplo con la forma exacta del contrato publico.
 *
 * Cada fabrica devuelve un objeto nuevo y admite sobrescribir campos, para que
 * una prueba diga solo lo que le importa.
 */
import type {
  EtiquetaPublica,
  MedioPublico,
  PostDeListado,
  PostDetallado,
  ProfilePublico,
  ProyectoDeListado,
  ProyectoDetallado,
  ResultadoDeBusqueda,
  ReviewDeListado,
  ReviewDetallada,
  VideoDeListado,
} from '../services/public/types';

export const FECHA = '2026-08-15T10:00:00Z';

export function etiqueta(extra: Partial<EtiquetaPublica> = {}): EtiquetaPublica {
  return { slug: 'docker', name: 'Docker', description: null, ...extra };
}

export function medio(extra: Partial<MedioPublico> = {}): MedioPublico {
  return {
    alt_text: 'Portada del articulo',
    width: 1200,
    height: 800,
    access_url: 'http://almacen.de-prueba.test/bucket/clave?X-Amz-Signature=firma',
    ...extra,
  };
}

export function post(extra: Partial<PostDeListado> = {}): PostDeListado {
  return {
    slug: 'hola-mundo',
    title: 'Hola mundo',
    summary: 'Primer articulo del blog.',
    published_at: FECHA,
    tags: [etiqueta()],
    cover: medio(),
    ...extra,
  };
}

export function postDetallado(extra: Partial<PostDetallado> = {}): PostDetallado {
  return {
    ...post(),
    content: '## Seccion\n\nTexto del **articulo** con [un enlace](https://ejemplo.test/).',
    reading_time_minutes: 3,
    seo_title: null,
    seo_description: null,
    ...extra,
  };
}

export function review(extra: Partial<ReviewDeListado> = {}): ReviewDeListado {
  return {
    slug: 'clean-code',
    title: 'Review de Clean Code',
    summary: 'Un clasico.',
    published_at: FECHA,
    tags: [etiqueta({ slug: 'libros', name: 'Libros' })],
    cover: medio({ alt_text: 'Portada del libro' }),
    book_title: 'Clean Code',
    book_author: 'Robert C. Martin',
    rating: 4,
    ...extra,
  };
}

export function reviewDetallada(extra: Partial<ReviewDetallada> = {}): ReviewDetallada {
  return {
    ...review(),
    content: 'Texto de la *review*.',
    reading_time_minutes: 2,
    external_link: 'https://editorial.test/clean-code',
    seo_title: null,
    seo_description: null,
    ...extra,
  };
}

export function video(extra: Partial<VideoDeListado> = {}): VideoDeListado {
  return {
    slug: 'intro-docker',
    title: 'Introduccion a Docker',
    summary: 'Video introductorio.',
    published_at: FECHA,
    tags: [etiqueta()],
    thumbnail: medio({ alt_text: 'Miniatura del video' }),
    provider: 'youtube',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embed_reference: 'dQw4w9WgXcQ',
    duration_seconds: 754,
    ...extra,
  };
}

export function proyecto(extra: Partial<ProyectoDeListado> = {}): ProyectoDeListado {
  return {
    slug: 'blog-personal',
    title: 'Blog personal',
    summary: 'Este mismo sitio.',
    published_at: FECHA,
    tags: [etiqueta({ slug: 'react', name: 'React' })],
    cover: medio({ alt_text: 'Captura del proyecto' }),
    technologies: ['React', 'FastAPI'],
    repository_url: 'https://github.com/ejemplo/blog',
    demo_url: null,
    project_status: 'active',
    ...extra,
  };
}

export function proyectoDetallado(extra: Partial<ProyectoDetallado> = {}): ProyectoDetallado {
  return {
    ...proyecto(),
    content: 'Descripcion del proyecto.',
    reading_time_minutes: 1,
    seo_title: null,
    seo_description: null,
    ...extra,
  };
}

export function perfil(extra: Partial<ProfilePublico> = {}): ProfilePublico {
  return {
    full_name: 'Autora del Blog',
    headline: 'Ingeniera de software',
    biography: 'Escribo sobre **software**.',
    contact_email: 'hola@ejemplo.test',
    photo: medio({ alt_text: 'Retrato de la autora' }),
    seo_title: null,
    seo_description: null,
    social_links: [
      { label: 'GitHub', url: 'https://github.com/ejemplo' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ejemplo' },
    ],
    ...extra,
  };
}

export function resultado(extra: Partial<ResultadoDeBusqueda> = {}): ResultadoDeBusqueda {
  return {
    type: 'post',
    slug: 'hola-mundo',
    title: 'Hola mundo',
    summary: 'Primer articulo del blog.',
    published_at: FECHA,
    ...extra,
  };
}
