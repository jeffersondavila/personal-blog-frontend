/**
 * Inicio (USER_FLOWS A.1): presentacion breve, contenido destacado por tipo y
 * accesos a las secciones. Cinco peticiones **independientes**: un bloque que
 * falla no tumba la portada.
 *
 * Sustituye a la prueba de la pantalla provisional de fundacion (`Task/006`,
 * `Task/007`), que esta portada reemplaza por diseno (ficha de `Task/014`,
 * decision D-014-G).
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NOMBRE_DEL_SITIO } from '../lib/site';
import { RUTAS } from '../lib/rutas';
import { perfil, post, proyecto, review, video } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, noEncontrado, pagina, respuestaJson, rutasPedidas } from '../test/respuestas';

const API_COMPLETA = {
  '/api/v1/profile': () => respuestaJson(perfil()),
  '/api/v1/posts': () => respuestaJson(pagina([post()])),
  '/api/v1/book-reviews': () => respuestaJson(pagina([review()])),
  '/api/v1/videos': () => respuestaJson(pagina([video()])),
  '/api/v1/projects': () => respuestaJson(pagina([proyecto()])),
};

describe('HomePage', () => {
  it('pide el perfil y los destacados de los cuatro tipos con featured=true y page_size=3', async () => {
    const { fetchFn } = renderRuta(RUTAS.inicio, API_COMPLETA);

    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(5);
    });

    const rutas = rutasPedidas(fetchFn).sort();
    expect(rutas).toEqual([
      '/api/v1/book-reviews?featured=true&page_size=3',
      '/api/v1/posts?featured=true&page_size=3',
      '/api/v1/profile',
      '/api/v1/projects?featured=true&page_size=3',
      '/api/v1/videos?featured=true&page_size=3',
    ]);
  });

  it('muestra la presentacion del perfil y una seccion por tipo con sus destacados', async () => {
    renderRuta(RUTAS.inicio, API_COMPLETA);

    const presentacion = await screen.findByRole('heading', { level: 1, name: /autora del blog/i });
    expect(presentacion).toBeInTheDocument();
    expect(screen.getByText('Ingeniera de software')).toBeInTheDocument();
    // La cabecera y el pie tambien enlazan a Quién soy: se busca dentro de `main`.
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /qui[eé]n soy/i }),
    ).toHaveAttribute('href', RUTAS.quienSoy);

    for (const [nombre, titulo] of [
      [/art[ií]culos destacados/i, 'Hola mundo'],
      [/reviews destacadas/i, 'Review de Clean Code'],
      [/videos destacados/i, 'Introduccion a Docker'],
      [/proyectos destacados/i, 'Blog personal'],
    ] as const) {
      const seccion = await screen.findByRole('region', { name: nombre });
      expect(within(seccion).getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(within(seccion).getByRole('heading', { level: 3, name: titulo })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(NOMBRE_DEL_SITIO);
  });

  it('cada seccion enlaza a su listado completo', async () => {
    renderRuta(RUTAS.inicio, API_COMPLETA);

    const seccion = await screen.findByRole('region', { name: /art[ií]culos destacados/i });
    expect(
      within(seccion).getByRole('link', { name: /ver todos los art[ií]culos/i }),
    ).toHaveAttribute('href', RUTAS.articulos);
  });

  it('con el perfil aun sin semilla omite la presentacion y conserva un h1 y las secciones', async () => {
    renderRuta(RUTAS.inicio, { ...API_COMPLETA, '/api/v1/profile': () => noEncontrado() });

    const seccion = await screen.findByRole('region', { name: /art[ií]culos destacados/i });
    expect(
      within(seccion).getByRole('heading', { level: 3, name: 'Hola mundo' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(NOMBRE_DEL_SITIO);
    expect(screen.queryByRole('heading', { name: /404/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('una seccion sin destacados lo dice y enlaza a su listado, sin lista vacia', async () => {
    renderRuta(RUTAS.inicio, {
      ...API_COMPLETA,
      '/api/v1/videos': () => respuestaJson(pagina([])),
    });

    const seccion = await screen.findByRole('region', { name: /videos destacados/i });
    expect(
      await within(seccion).findByText(/todav[ií]a no hay videos destacados/i),
    ).toBeInTheDocument();
    expect(within(seccion).getByRole('link', { name: /ver todos los videos/i })).toHaveAttribute(
      'href',
      RUTAS.videos,
    );
  });

  it('el fallo de un bloque muestra su error con reintento sin tumbar los demas', async () => {
    let intentos = 0;
    renderRuta(RUTAS.inicio, {
      ...API_COMPLETA,
      '/api/v1/projects': () => {
        intentos += 1;
        return intentos === 1 ? fallo() : respuestaJson(pagina([proyecto()]));
      },
    });

    const proyectos = await screen.findByRole('region', { name: /proyectos destacados/i });
    const alerta = await within(proyectos).findByRole('alert');
    // Los demas bloques siguen en pie.
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Hola mundo' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);

    await act(async () => {
      fireEvent.click(within(alerta).getByRole('button', { name: /reintentar/i }));
      await Promise.resolve();
    });

    expect(
      await within(proyectos).findByRole('heading', { level: 3, name: 'Blog personal' }),
    ).toBeInTheDocument();
    expect(intentos).toBe(2);
  });

  it('no consulta /health ni ningun recurso administrativo', async () => {
    const { fetchFn } = renderRuta(RUTAS.inicio, API_COMPLETA);

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(5);
    });
    expect(rutasPedidas(fetchFn).some((r) => r.includes('/health') || r.includes('/admin'))).toBe(
      false,
    );
  });
});
