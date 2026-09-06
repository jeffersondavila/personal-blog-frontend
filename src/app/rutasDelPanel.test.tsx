/**
 * Las dieciocho superficies del panel, sobre la tabla de rutas real.
 *
 * Se monta `routes`, no una tabla de prueba: lo que se prueba y lo que sirve el
 * navegador no pueden divergir. Como el subarbol es diferido, todo se espera con
 * `findBy*`.
 */
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { conSesion, renderPanel, sinSesion } from '../test/renderPanel';
import { pagina, respuestaJson } from '../test/respuestas';
import { rutasPedidas } from '../test/respuestas';

/** Colecciones vacias para las rutas que cargan datos al montarse. */
const VACIO = {
  '/api/v1/admin/posts': () => respuestaJson(pagina([])),
  '/api/v1/admin/book-reviews': () => respuestaJson(pagina([])),
  '/api/v1/admin/videos': () => respuestaJson(pagina([])),
  '/api/v1/admin/projects': () => respuestaJson(pagina([])),
  '/api/v1/admin/tags': () => respuestaJson(pagina([])),
  '/api/v1/admin/media': () => respuestaJson(pagina([])),
  '/api/v1/admin/audit-events': () => respuestaJson(pagina([])),
};

describe('rutas del panel — las 18 superficies', () => {
  it('1. `/admin/acceso` muestra el formulario de acceso sin exigir sesion', async () => {
    renderPanel('/admin/acceso', sinSesion());

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' })).toBeVisible();
  });

  it.each([
    ['2. `/admin`', '/admin', 'Panel administrativo'],
    ['3. `/admin/articulos`', '/admin/articulos', 'Artículos'],
    ['4. `/admin/articulos/nuevo`', '/admin/articulos/nuevo', 'Crear artículo'],
    ['6. `/admin/reviews`', '/admin/reviews', 'Reviews'],
    ['7. `/admin/reviews/nuevo`', '/admin/reviews/nuevo', 'Crear review'],
    ['9. `/admin/videos`', '/admin/videos', 'Videos'],
    ['10. `/admin/videos/nuevo`', '/admin/videos/nuevo', 'Crear video'],
    ['12. `/admin/proyectos`', '/admin/proyectos', 'Proyectos'],
    ['13. `/admin/proyectos/nuevo`', '/admin/proyectos/nuevo', 'Crear proyecto'],
    ['15. `/admin/etiquetas`', '/admin/etiquetas', 'Etiquetas'],
    ['16. `/admin/medios`', '/admin/medios', 'Medios'],
  ])('%s resuelve con sesion valida', async (_nombre, ruta, encabezado) => {
    renderPanel(ruta, { ...conSesion(), ...VACIO });

    expect(await screen.findByRole('heading', { level: 1, name: encabezado })).toBeVisible();
  });

  it.each([
    ['5. edicion de articulo', '/admin/articulos/abc', 'Editar artículo'],
    ['8. edicion de review', '/admin/reviews/abc', 'Editar review'],
    ['11. edicion de video', '/admin/videos/abc', 'Editar video'],
    ['14. edicion de proyecto', '/admin/proyectos/abc', 'Editar proyecto'],
  ])('%s es la superficie de edicion, sin detalle aparte', async (_nombre, ruta, encabezado) => {
    const elemento = {
      id: 'abc',
      slug: 'algo',
      title: 'Algo',
      summary: null,
      content: '',
      status: 'draft',
      published_at: null,
      featured: false,
      seo_title: null,
      seo_description: null,
      cover: null,
      thumbnail: null,
      tags: [],
      technologies: [],
      project_status: 'active',
      created_at: '2026-09-05T00:00:00Z',
      updated_at: '2026-09-05T00:00:00Z',
    };
    renderPanel(ruta, {
      ...conSesion(),
      ...VACIO,
      '/api/v1/admin/posts/abc': () => respuestaJson(elemento),
      '/api/v1/admin/book-reviews/abc': () => respuestaJson(elemento),
      '/api/v1/admin/videos/abc': () => respuestaJson(elemento),
      '/api/v1/admin/projects/abc': () => respuestaJson(elemento),
    });

    expect(await screen.findByRole('heading', { level: 1, name: encabezado })).toBeVisible();
  });

  it('17. `/admin/perfil` explica la ausencia de perfil en lugar de fallar', async () => {
    renderPanel('/admin/perfil', conSesion());

    expect(await screen.findByRole('heading', { level: 1, name: 'Perfil' })).toBeVisible();
  });

  it('18. una ruta desconocida del panel da la 404 **del panel**', async () => {
    renderPanel('/admin/lo-que-sea', conSesion());

    expect(
      await screen.findByRole('heading', { level: 1, name: /Esta página del panel no existe/ }),
    ).toBeVisible();
  });
});

describe('rutas del panel — convivencia con el sitio publico', () => {
  it('el comodin publico no captura el panel', async () => {
    renderPanel('/admin/acceso', sinSesion());

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' })).toBeVisible();
    expect(screen.queryByText('Página no encontrada')).toBeNull();
  });

  it('una visita publica **no** consulta la sesion administrativa', async () => {
    const { fetchFn } = renderPanel('/', {
      '/api/v1/profile': () =>
        respuestaJson({
          full_name: 'x',
          headline: null,
          biography: '',
          contact_email: null,
          photo: null,
          social_links: [],
        }),
      '/api/v1/posts': () => respuestaJson(pagina([])),
      '/api/v1/book-reviews': () => respuestaJson(pagina([])),
      '/api/v1/videos': () => respuestaJson(pagina([])),
      '/api/v1/projects': () => respuestaJson(pagina([])),
    });

    await screen.findByRole('main');

    expect(rutasPedidas(fetchFn).filter((ruta) => ruta.includes('/admin'))).toEqual([]);
  });
});
