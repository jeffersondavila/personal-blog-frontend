/**
 * Layout del sitio publico: landmarks, navegacion principal con estado activo,
 * enlace de salto y buscador nativo (A-01, A-02).
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RUTAS, SECCIONES } from '../lib/rutas';
import { renderRuta } from '../test/renderRuta';
import { pagina, respuestaJson } from '../test/respuestas';

const API = {
  '/api/v1/posts': () => respuestaJson(pagina([])),
  '/api/v1/tags': () => respuestaJson(pagina([])),
};

describe('SiteLayout', () => {
  it('expone los landmarks header, nav, main y footer', async () => {
    renderRuta(RUTAS.articulos, API);

    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /principal/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('la navegacion principal enlaza a Inicio y a las seis secciones', async () => {
    renderRuta(RUTAS.articulos, API);

    const nav = await screen.findByRole('navigation', { name: /principal/i });
    const enlaces = within(nav).getAllByRole('link');

    expect(enlaces.map((enlace) => enlace.getAttribute('href'))).toEqual([
      RUTAS.inicio,
      ...SECCIONES.map((seccion) => seccion.ruta),
    ]);
  });

  it('marca con aria-current la seccion activa y solo esa', async () => {
    renderRuta(RUTAS.articulos, API);

    const nav = await screen.findByRole('navigation', { name: /principal/i });
    const activos = within(nav)
      .getAllByRole('link')
      .filter((enlace) => enlace.getAttribute('aria-current') === 'page');

    expect(activos).toHaveLength(1);
    expect(activos[0]).toHaveAttribute('href', RUTAS.articulos);
  });

  it('ofrece un enlace de salto al contenido principal como primer elemento enfocable', async () => {
    renderRuta(RUTAS.articulos, API);

    const salto = await screen.findByRole('link', { name: /saltar al contenido/i });
    expect(salto).toHaveAttribute('href', '#contenido');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido');
    expect(document.body.querySelector('a')).toBe(salto);
  });

  it('el buscador es un formulario nativo con label visible que navega a /buscar', async () => {
    renderRuta(RUTAS.articulos, API);

    const buscador = await screen.findByRole('search');
    const campo = within(buscador).getByLabelText(/buscar/i);

    expect(campo).toHaveAttribute('type', 'search');
    expect(campo).toHaveAttribute('name', 'q');
    expect(buscador).toHaveAttribute('action', RUTAS.buscar);
    expect(within(buscador).getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('el pie enlaza a la pagina de contacto', async () => {
    renderRuta(RUTAS.articulos, API);

    const pie = await screen.findByRole('contentinfo');
    expect(within(pie).getByRole('link', { name: /contacto/i })).toHaveAttribute(
      'href',
      RUTAS.contacto,
    );
  });
});
