/**
 * Tabla de rutas del sitio publico (decision D-014-A).
 *
 * Doce superficies: las once paginas y el comodin 404. `/__design-system`
 * sigue registrada solo en desarrollo y el comodin sigue siendo la ultima
 * ruta de la tabla.
 */
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DESIGN_SYSTEM_PATH, routes } from './routes';
import { RUTAS } from '../lib/rutas';
import { perfil, postDetallado, proyectoDetallado, reviewDetallada } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { pagina, respuestaJson } from '../test/respuestas';

const API = {
  '/api/v1/profile': () => respuestaJson(perfil()),
  '/api/v1/posts': () => respuestaJson(pagina([])),
  '/api/v1/book-reviews': () => respuestaJson(pagina([])),
  '/api/v1/videos': () => respuestaJson(pagina([])),
  '/api/v1/projects': () => respuestaJson(pagina([])),
  '/api/v1/tags': () => respuestaJson(pagina([])),
  '/api/v1/search': () => respuestaJson(pagina([])),
  '/api/v1/posts/hola-mundo': () => respuestaJson(postDetallado()),
  '/api/v1/book-reviews/clean-code': () => respuestaJson(reviewDetallada()),
  '/api/v1/projects/blog-personal': () => respuestaJson(proyectoDetallado()),
};

/** Rutas cuyo `h1` es fijo y no depende del API. */
const PAGINAS_FIJAS: readonly [ruta: string, h1: RegExp][] = [
  // En Quién soy el `h1` es el nombre del autor que entrega el perfil.
  [RUTAS.quienSoy, /autora del blog/i],
  [RUTAS.articulos, /art[ií]culos/i],
  [RUTAS.reviews, /reviews/i],
  [RUTAS.videos, /videos/i],
  [RUTAS.proyectos, /proyectos/i],
  [RUTAS.contacto, /contacto/i],
  [`${RUTAS.buscar}?q=docker`, /b[uú]squeda|resultados/i],
];

const DETALLES: readonly string[] = [
  `${RUTAS.articulos}/hola-mundo`,
  `${RUTAS.reviews}/clean-code`,
  `${RUTAS.proyectos}/blog-personal`,
];

describe('tabla de rutas', () => {
  it('registra la superficie de demostracion solo en desarrollo y no la deja absorber el comodin', () => {
    expect(routes.some((route) => route.path === DESIGN_SYSTEM_PATH)).toBe(true);
    expect(routes.at(-1)?.path).toBe('*');
  });

  it.each(PAGINAS_FIJAS)('%s renderiza su pagina dentro del layout', async (ruta, h1) => {
    renderRuta(ruta, API);

    expect(await screen.findByRole('heading', { level: 1, name: h1 })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: /404/ })).not.toBeInTheDocument();
  });

  it.each(DETALLES)('%s resuelve a una pagina de detalle y no al comodin', async (ruta) => {
    renderRuta(ruta, API);

    expect(await screen.findByRole('main')).toBeInTheDocument();
    // La pagina 404 solo aparece si el API dice que el recurso no existe.
    expect(screen.queryByRole('heading', { level: 1, name: /404/ })).not.toBeInTheDocument();
  });

  it('una ruta inexistente cae en la pagina 404, tambien dentro del layout', async () => {
    renderRuta('/esta-ruta-no-existe', API);

    expect(await screen.findByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /principal/i })).toBeInTheDocument();
  });

  it('no existe detalle de video: /videos/<slug> es una ruta inexistente', async () => {
    renderRuta(`${RUTAS.videos}/intro-docker`, API);

    expect(await screen.findByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
  });
});
