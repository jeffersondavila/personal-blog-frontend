/**
 * Formularios de contenido, medios y perfil.
 *
 * Lo que se comprueba es **comportamiento del usuario y contrato enviado**, no
 * implementacion interna: que exista la etiqueta accesible, que el error se
 * anuncie, y que el cuerpo que sale por la red sea exactamente el que el
 * contrato admite —incluido **lo que no se envia**—.
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { conSesion, renderPanel } from '../../test/renderPanel';
import { pagina, respuestaDeError, respuestaJson } from '../../test/respuestas';
import type { FetchFalso, Manejador } from '../../test/respuestas';

const CATALOGO = {
  '/api/v1/admin/tags': () =>
    respuestaJson(
      pagina([
        {
          id: 'tag-1',
          slug: 'docker',
          name: 'Docker',
          description: null,
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ]),
    ),
  '/api/v1/admin/media': () => respuestaJson(pagina([])),
};

function articulo(cambios: Record<string, unknown> = {}) {
  return {
    id: 'abc',
    slug: 'docker-en-produccion',
    title: 'Docker en producción',
    summary: null,
    content: '# Hola',
    status: 'draft',
    published_at: null,
    featured: false,
    seo_title: null,
    seo_description: null,
    cover: null,
    tags: [],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...cambios,
  };
}

/** Cuerpo JSON de la ultima peticion que uso ese metodo. */
function cuerpoDe(fetchFn: FetchFalso, metodo: string): Record<string, unknown> {
  const llamada = [...fetchFn.mock.calls].reverse().find((c) => c[1]?.method === metodo);
  if (llamada === undefined) {
    throw new Error(`No hubo ninguna peticion ${metodo}.`);
  }
  return JSON.parse(llamada[1]?.body as string) as Record<string, unknown>;
}

describe('formulario de contenido — A-03: toda etiqueta asociada', () => {
  it('cada campo tiene un nombre accesible propio', async () => {
    renderPanel('/admin/articulos/nuevo', { ...conSesion(), ...CATALOGO });

    await screen.findByRole('heading', { level: 1, name: 'Crear artículo' });

    for (const etiqueta of [
      /Título \(obligatorio\)/,
      /^Slug$/,
      /^Resumen$/,
      /^Título SEO$/,
      /^Descripción SEO$/,
    ]) {
      expect(screen.getByLabelText(etiqueta)).toBeInTheDocument();
    }
  });

  it('marca lo obligatorio con texto, no solo con color (A-07)', async () => {
    renderPanel('/admin/articulos/nuevo', { ...conSesion(), ...CATALOGO });

    await screen.findByRole('heading', { level: 1, name: 'Crear artículo' });

    expect(screen.getByLabelText(/Título \(obligatorio\)/)).toBeRequired();
  });
});

describe('formulario de contenido — contrato enviado', () => {
  it('crea con `POST` y no envía `status` ni `published_at`', async () => {
    const { fetchFn } = renderPanel('/admin/articulos/nuevo', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/posts': (_url, init) =>
        init?.method === 'POST' ? respuestaJson(articulo(), 201) : respuestaJson(pagina([])),
      '/api/v1/admin/posts/abc': () => respuestaJson(articulo()),
    });

    await screen.findByRole('heading', { level: 1, name: 'Crear artículo' });
    fireEvent.change(screen.getByLabelText(/Título \(obligatorio\)/), {
      target: { value: 'Nuevo' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
      await Promise.resolve();
    });

    const cuerpo = cuerpoDe(fetchFn, 'POST');
    expect(cuerpo['title']).toBe('Nuevo');
    expect(cuerpo).not.toHaveProperty('status');
    expect(cuerpo).not.toHaveProperty('published_at');
  });

  it('un slug vacío viaja como `null` para que el backend lo derive del título', async () => {
    const { fetchFn } = renderPanel('/admin/articulos/nuevo', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/posts': (_url, init) =>
        init?.method === 'POST' ? respuestaJson(articulo(), 201) : respuestaJson(pagina([])),
      '/api/v1/admin/posts/abc': () => respuestaJson(articulo()),
    });

    await screen.findByRole('heading', { level: 1, name: 'Crear artículo' });
    fireEvent.change(screen.getByLabelText(/Título \(obligatorio\)/), {
      target: { value: 'Nuevo' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
      await Promise.resolve();
    });

    expect(cuerpoDe(fetchFn, 'POST')['slug']).toBeNull();
  });

  it('un `409 slug_already_exists` se anuncia con su mensaje propio', async () => {
    renderPanel('/admin/articulos/nuevo', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/posts': (_url, init) =>
        init?.method === 'POST'
          ? respuestaDeError('slug_already_exists', 409, 'Duplicado.')
          : respuestaJson(pagina([])),
    });

    await screen.findByRole('heading', { level: 1, name: 'Crear artículo' });
    fireEvent.change(screen.getByLabelText(/Título \(obligatorio\)/), {
      target: { value: 'Nuevo' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
      await Promise.resolve();
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya existe otro contenido/i);
  });

  it('A-08: un borrador incompleto lista **todos** los campos que faltan', async () => {
    renderPanel('/admin/articulos/abc', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/posts/abc': () => respuestaJson(articulo()),
      '/api/v1/admin/posts/abc/publish': () =>
        respuestaJson(
          {
            error: {
              code: 'cannot_publish_incomplete_draft',
              message: 'Faltan campos.',
              details: { campos: ['content', 'summary'] },
              request_id: 'r1',
            },
          },
          409,
        ),
    });

    await screen.findByRole('heading', { level: 1, name: 'Editar artículo' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
      await Promise.resolve();
    });

    const aviso = await screen.findByRole('alert');
    expect(within(aviso).getByText('Contenido')).toBeVisible();
    expect(within(aviso).getByText('Resumen')).toBeVisible();
  });

  it('el slug deja de ser editable en cuanto el contenido se publicó alguna vez', async () => {
    renderPanel('/admin/articulos/abc', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/posts/abc': () =>
        respuestaJson(articulo({ status: 'published', published_at: '2026-09-02T00:00:00Z' })),
    });

    await screen.findByRole('heading', { level: 1, name: 'Editar artículo' });

    expect(screen.getByLabelText(/^Slug$/)).toBeDisabled();
  });
});

describe('transiciones — la interfaz refleja el contrato', () => {
  it('un artículo publicado ofrece despublicar y archivar', async () => {
    renderPanel('/admin/articulos/abc', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/posts/abc': () =>
        respuestaJson(articulo({ status: 'published', published_at: '2026-09-02T00:00:00Z' })),
    });

    await screen.findByRole('heading', { level: 1, name: 'Editar artículo' });

    expect(screen.getByRole('button', { name: 'Despublicar' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeVisible();
  });

  it('un vídeo publicado **no** ofrece despublicar: la ruta no existe', async () => {
    renderPanel('/admin/videos/abc', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/videos/abc': () =>
        respuestaJson({
          ...articulo({ status: 'published', published_at: '2026-09-02T00:00:00Z' }),
          thumbnail: null,
          provider: null,
          video_url: null,
          embed_reference: null,
          duration_seconds: null,
        }),
    });

    await screen.findByRole('heading', { level: 1, name: 'Editar video' });

    expect(screen.queryByRole('button', { name: 'Despublicar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeVisible();
  });

  it('un contenido archivado no ofrece ninguna transición', async () => {
    renderPanel('/admin/articulos/abc', {
      ...conSesion(),
      ...CATALOGO,
      '/api/v1/admin/posts/abc': () =>
        respuestaJson(articulo({ status: 'archived', published_at: '2026-09-02T00:00:00Z' })),
    });

    await screen.findByRole('heading', { level: 1, name: 'Editar artículo' });

    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Archivar' })).toBeNull();
  });
});

describe('Markdown — el mismo pipeline sanitizado del sitio público', () => {
  it('el vídeo no tiene editor Markdown', async () => {
    renderPanel('/admin/videos/nuevo', { ...conSesion(), ...CATALOGO });

    await screen.findByRole('heading', { level: 1, name: 'Crear video' });

    expect(screen.queryByRole('button', { name: 'Vista previa' })).toBeNull();
  });

  it('el artículo sí lo tiene, y la vista previa neutraliza el HTML peligroso', async () => {
    renderPanel('/admin/articulos/nuevo', { ...conSesion(), ...CATALOGO });

    await screen.findByRole('heading', { level: 1, name: 'Crear artículo' });
    fireEvent.change(screen.getByLabelText(/Contenido/), {
      target: { value: '# Título\n\n<script>alert(1)</script>' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
      await Promise.resolve();
    });

    expect(await screen.findByRole('heading', { level: 2, name: 'Título' })).toBeVisible();
    expect(document.querySelector('script')).toBeNull();
  });
});

describe('medios — render frente a escritura', () => {
  it('carga la imagen como `multipart`, sin `Content-Type` propio', async () => {
    const { fetchFn } = renderPanel('/admin/medios', {
      ...conSesion(),
      '/api/v1/admin/media': (_url, init) =>
        init?.method === 'POST'
          ? respuestaJson({ id: 'm1', original_filename: 'x.png' }, 201)
          : respuestaJson(pagina([])),
    });

    await screen.findByRole('heading', { level: 1, name: 'Medios' });
    const archivo = new File(['bytes'], 'imagen.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Archivo/), { target: { files: [archivo] } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Subir' }));
      await Promise.resolve();
    });

    const llamada = fetchFn.mock.calls.find((c) => c[1]?.method === 'POST');
    if (llamada === undefined) {
      throw new Error('No hubo carga.');
    }
    expect(llamada[1]?.body).toBeInstanceOf(FormData);
    expect(new Headers(llamada[1]?.headers).has('Content-Type')).toBe(false);
  });

  it('un `409 media_in_use` dice dónde se usa en lugar de un error genérico', async () => {
    renderPanel('/admin/medios', {
      ...conSesion(),
      '/api/v1/admin/media': () =>
        respuestaJson(
          pagina([
            {
              id: 'm1',
              original_filename: 'foto.png',
              mime_type: 'image/png',
              size_bytes: 2048,
              width: 10,
              height: 10,
              alt_text: null,
              checksum: null,
              created_at: '2026-09-01T00:00:00Z',
              access_url: 'https://ejemplo.invalid/firmada',
            },
          ]),
        ),
      '/api/v1/admin/media/m1': () =>
        respuestaJson(
          {
            error: {
              code: 'media_in_use',
              message: 'En uso.',
              details: { usos: ['post: docker-en-produccion'] },
              request_id: 'r1',
            },
          },
          409,
        ),
    });

    await screen.findByRole('heading', { level: 1, name: 'Medios' });
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
      await Promise.resolve();
    });

    const avisos = await screen.findAllByRole('alert');
    const aviso = avisos.find((elemento) => elemento.textContent.includes('en uso'));
    expect(aviso).toBeDefined();
    expect(aviso).toHaveTextContent('post: docker-en-produccion');
  });

  it('la imagen se muestra por `access_url` y nunca por `object_key`', async () => {
    renderPanel('/admin/medios', {
      ...conSesion(),
      '/api/v1/admin/media': () =>
        respuestaJson(
          pagina([
            {
              id: 'm1',
              original_filename: 'foto.png',
              mime_type: 'image/png',
              size_bytes: 2048,
              width: 10,
              height: 10,
              alt_text: 'Una foto',
              checksum: null,
              created_at: '2026-09-01T00:00:00Z',
              access_url: 'https://ejemplo.invalid/firmada',
            },
          ]),
        ),
    });

    await screen.findByRole('heading', { level: 1, name: 'Medios' });

    expect(await screen.findByAltText('Una foto')).toHaveAttribute(
      'src',
      'https://ejemplo.invalid/firmada',
    );
  });

  it('borrar exige confirmación y se puede cancelar', async () => {
    const manejadores: Record<string, Manejador> = {
      ...conSesion(),
      '/api/v1/admin/media': () =>
        respuestaJson(
          pagina([
            {
              id: 'm1',
              original_filename: 'foto.png',
              mime_type: 'image/png',
              size_bytes: 2048,
              width: null,
              height: null,
              alt_text: null,
              checksum: null,
              created_at: '2026-09-01T00:00:00Z',
              access_url: null,
            },
          ]),
        ),
    };
    const { fetchFn } = renderPanel('/admin/medios', manejadores);

    await screen.findByRole('heading', { level: 1, name: 'Medios' });
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(fetchFn.mock.calls.some((c) => c[1]?.method === 'DELETE')).toBe(false);
    });
  });
});

describe('perfil — singleton', () => {
  it('un `404` se explica como ausencia de semilla, no como error', async () => {
    renderPanel('/admin/perfil', conSesion());

    expect(await screen.findByText(/Todavía no existe el perfil/)).toBeVisible();
  });

  it('guarda con `PUT` y mantiene el orden de los enlaces sociales', async () => {
    const { fetchFn } = renderPanel('/admin/perfil', {
      ...conSesion(),
      '/api/v1/admin/media': () => respuestaJson(pagina([])),
      '/api/v1/admin/profile': (_url, init) =>
        respuestaJson({
          id: 'p1',
          full_name: 'Jefferson',
          headline: null,
          biography: '',
          contact_email: null,
          photo: null,
          seo_title: null,
          seo_description: null,
          social_links:
            init?.method === 'PUT'
              ? [{ label: 'GitHub', url: 'https://github.invalid' }]
              : [{ label: 'GitHub', url: 'https://github.invalid' }],
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        }),
    });

    await screen.findByRole('heading', { level: 1, name: 'Perfil' });
    // Se espera a que el formulario refleje lo cargado: es la precondicion que
    // tambien tiene una persona antes de pulsar «Guardar».
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre completo/)).toHaveValue('Jefferson');
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
      await Promise.resolve();
    });

    const cuerpo = cuerpoDe(fetchFn, 'PUT');
    expect(cuerpo['social_links']).toEqual([{ label: 'GitHub', url: 'https://github.invalid' }]);
  });
});
