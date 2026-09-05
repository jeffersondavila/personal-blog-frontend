import { describe, expect, it } from 'vitest';

import { fetchProject, fetchProjects } from './projects';
import { createHttpClient } from '../http';
import {
  crearFetchFalso,
  pagina,
  respuestaJson,
  urlDeLlamada,
  type FetchFalso,
} from '../../test/respuestas';

const cliente = (fetchFn: FetchFalso) =>
  createHttpClient({ baseUrl: 'http://api.de-prueba.test', fetchFn });

describe('fetchProjects', () => {
  it('pide /api/v1/projects', async () => {
    const fetchFn = crearFetchFalso({ '/api/v1/projects': () => respuestaJson(pagina([])) });

    await fetchProjects(cliente(fetchFn), { featured: true, pageSize: 3 });

    const url = urlDeLlamada(fetchFn);
    expect(url.pathname).toBe('/api/v1/projects');
    expect([...url.searchParams.entries()].sort()).toEqual([
      ['featured', 'true'],
      ['page_size', '3'],
    ]);
  });
});

describe('fetchProject', () => {
  it('pide /api/v1/projects/{slug}', async () => {
    const fetchFn = crearFetchFalso({
      '/api/v1/projects/blog': () =>
        respuestaJson({
          slug: 'blog',
          title: 'Blog',
          summary: null,
          published_at: null,
          tags: [],
          cover: null,
          technologies: ['react'],
          repository_url: null,
          demo_url: null,
          project_status: 'active',
          content: 'Texto',
          reading_time_minutes: 1,
          seo_title: null,
          seo_description: null,
        }),
    });

    const proyecto = await fetchProject(cliente(fetchFn), 'blog');

    expect(urlDeLlamada(fetchFn).pathname).toBe('/api/v1/projects/blog');
    expect(proyecto.project_status).toBe('active');
  });
});
