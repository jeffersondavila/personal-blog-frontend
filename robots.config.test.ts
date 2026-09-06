/**
 * Contenido de `robots.txt` (`Task/016`, requisito E-06).
 *
 * Vive en la raiz y no en `src/` porque `robots.config.ts` es **configuracion de
 * build**, no codigo de aplicacion: lo consume `vite.config.ts`, y el proyecto de
 * TypeScript del build (`tsconfig.node.json`) esta deliberadamente separado del
 * de la aplicacion.
 *
 * Se prueba la funcion pura; que el archivo **llegue a `dist/`** y no sea HTML se
 * comprueba en `src/app/seo.guards.test.ts`, sobre el artefacto real.
 */
import { describe, expect, it } from 'vitest';

import { construirRobotsTxt } from './robots.config';

describe('construirRobotsTxt', () => {
  it('permite el rastreo general', () => {
    const contenido = construirRobotsTxt({ apiBaseUrl: 'http://localhost:8081' });

    expect(contenido).toContain('User-agent: *');
  });

  it('excluye el panel administrativo (E-06)', () => {
    const contenido = construirRobotsTxt({ apiBaseUrl: 'http://localhost:8081' });

    expect(contenido).toContain('Disallow: /admin/');
  });

  it('declara el sitemap con una URL absoluta del ORIGEN DEL API', () => {
    // El sitemap lo sirve el backend, asi que su URL se compone con el origen
    // del API. Un `robots.txt` puede declarar un sitemap alojado en otro
    // anfitrion controlado: el protocolo no exige que compartan host.
    const contenido = construirRobotsTxt({ apiBaseUrl: 'https://api.ejemplo.test' });

    expect(contenido).toContain('Sitemap: https://api.ejemplo.test/sitemap.xml');
  });

  it('normaliza una barra final del origen del API', () => {
    const contenido = construirRobotsTxt({ apiBaseUrl: 'https://api.ejemplo.test/' });

    expect(contenido).toContain('Sitemap: https://api.ejemplo.test/sitemap.xml');
    expect(contenido).not.toContain('//sitemap.xml');
  });

  it('omite la linea Sitemap cuando no hay origen del API', () => {
    // Fail-closed documental: es mejor no declarar sitemap que declarar uno en
    // una URL falsa. Un `Sitemap:` roto es un error que el buscador reporta.
    const contenido = construirRobotsTxt({});

    expect(contenido).not.toContain('Sitemap:');
    expect(contenido).toContain('Disallow: /admin/');
  });

  it('omite la linea Sitemap si el origen no es una URL absoluta', () => {
    const contenido = construirRobotsTxt({ apiBaseUrl: '/api' });

    expect(contenido).not.toContain('Sitemap:');
  });

  it('no excluye ninguna ruta publica', () => {
    const contenido = construirRobotsTxt({ apiBaseUrl: 'http://localhost:8081' });

    for (const publica of ['/articulos', '/reviews', '/videos', '/proyectos', '/quien-soy']) {
      expect(contenido).not.toContain(`Disallow: ${publica}`);
    }
  });

  it('no es HTML: un robots.txt servido como HTML es el defecto que esta tarea corrige', () => {
    const contenido = construirRobotsTxt({ apiBaseUrl: 'http://localhost:8081' });

    expect(contenido).not.toContain('<!doctype');
    expect(contenido).not.toContain('<html');
  });

  it('termina con un salto de linea', () => {
    expect(construirRobotsTxt({}).endsWith('\n')).toBe(true);
  });
});
