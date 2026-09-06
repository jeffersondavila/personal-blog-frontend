/**
 * Guardas de los artefactos SEO sobre el `dist/` **real** (`Task/016`).
 *
 * Se comprueban sobre el artefacto y no sobre el codigo fuente por la misma razon
 * que las guardas P-05 de `Task/015`: lo que sirve el *hosting* es `dist/`, y un
 * archivo que el build no emite no existe para un *crawler*, por muy escrito que
 * este el codigo que lo genera.
 *
 * | # | Que demuestra |
 * | --- | --- |
 * | **SEO-1** | `robots.txt` **existe** en `dist/` |
 * | **SEO-2** | **No es HTML**: el defecto medido antes de esta tarea |
 * | **SEO-3** | Declara `Disallow: /admin/` y el sitemap |
 * | **SEO-4** | La imagen Open Graph existe, es un PNG real y mide 1200x630 |
 * | **SEO-5** | El *bundle* referencia el activo **estatico**, no un enlace firmado |
 * | **SEO-6** | Anti-tautologia: los marcadores **si** estan en `dist/` |
 * | **SEO-7** | `index.html` trae los metadatos de SITIO, y solo esos |
 *
 * La suite se salta estas pruebas si no hay `dist/`, igual que las de P-05:
 * exigir un build para correr los tests unitarios haria lenta toda la suite. El
 * reporte de la tarea registra la ejecucion con `dist/` presente.
 */
/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { describe, expect, it } from 'vitest';

import { ALTO_DE_LA_IMAGEN_OG, ANCHO_DE_LA_IMAGEN_OG, RUTA_DE_LA_IMAGEN_OG } from '../features/seo';

const DIST = join(cwd(), 'dist');
const ASSETS = join(DIST, 'assets');
const hayBuild = existsSync(DIST) && existsSync(ASSETS);

/** Todos los JavaScript emitidos, concatenados. */
function bundleCompleto(): string {
  return readdirSync(ASSETS)
    .filter((nombre) => nombre.endsWith('.js'))
    .map((nombre) => readFileSync(join(ASSETS, nombre), 'utf8'))
    .join('\n');
}

describe.skipIf(!hayBuild)('SEO-1 a SEO-3 — robots.txt en el artefacto', () => {
  it('SEO-1: existe en la raiz de dist', () => {
    expect(existsSync(join(DIST, 'robots.txt'))).toBe(true);
  });

  it('SEO-2: no es HTML', () => {
    // Antes de `Task/016`, `GET /robots.txt` devolvia el `index.html` de la SPA
    // por el *fallback* `try_files`. Un `200` con contenido no analizable es peor
    // que un `404`: puede leerse como un `robots.txt` invalido.
    const contenido = readFileSync(join(DIST, 'robots.txt'), 'utf8');

    expect(contenido).not.toContain('<!doctype');
    expect(contenido).not.toContain('<html');
    expect(contenido).not.toContain('<div id="root">');
  });

  it('SEO-3: declara el panel como no rastreable y apunta al sitemap', () => {
    const contenido = readFileSync(join(DIST, 'robots.txt'), 'utf8');

    expect(contenido).toContain('User-agent: *');
    expect(contenido).toContain('Disallow: /admin/');
    expect(contenido).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
  });

  it('SEO-3b: no excluye ninguna ruta publica', () => {
    const contenido = readFileSync(join(DIST, 'robots.txt'), 'utf8');

    for (const publica of ['/articulos', '/reviews', '/videos', '/proyectos', '/quien-soy']) {
      expect(contenido).not.toContain(`Disallow: ${publica}`);
    }
  });
});

describe.skipIf(!hayBuild)('SEO-4 — la imagen Open Graph', () => {
  const archivo = join(DIST, RUTA_DE_LA_IMAGEN_OG.replace(/^\//, ''));

  it('existe en dist', () => {
    expect(existsSync(archivo)).toBe(true);
  });

  it('es un PNG real, no un SVG renombrado', () => {
    // Importa: los *crawlers* de redes sociales no renderizan SVG de forma
    // fiable, asi que `og:image` tiene que ser un raster.
    const cabecera = readFileSync(archivo).subarray(0, 8);

    expect([...cabecera]).toStrictEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it('mide exactamente lo que declaran og:image:width y og:image:height', () => {
    // Las dimensiones de un PNG viven en la cabecera IHDR, en big-endian.
    const datos = readFileSync(archivo);
    const ancho = datos.readUInt32BE(16);
    const alto = datos.readUInt32BE(20);

    expect(ancho).toBe(ANCHO_DE_LA_IMAGEN_OG);
    expect(alto).toBe(ALTO_DE_LA_IMAGEN_OG);
  });
});

describe.skipIf(!hayBuild)('SEO-5 — og:image nunca es un enlace caducable', () => {
  it('el `index.html` referencia el activo estatico del sitio', () => {
    // Regla ya vigente de **D-08**: nunca se publica una URL prefirmada como
    // dato canonico. `og:image` se declara en `index.html` —no en el *bundle*—
    // para que un *crawler* sin JavaScript lo vea y para no duplicarlo con lo
    // que emite `Seo`.
    expect(readFileSync(join(DIST, 'index.html'), 'utf8')).toContain(RUTA_DE_LA_IMAGEN_OG);
  });

  it('el bundle NO compone ninguna URL de imagen: la puerta no existe', () => {
    // Prueba estructural: si alguien anadiera una imagen dinamica al componente
    // `Seo`, la ruta del activo o una firma apareceria aqui.
    const bundle = bundleCompleto();

    expect(bundle).not.toContain('X-Amz-Signature');
    expect(bundle).not.toContain('X-Amz-Credential');
    expect(bundle).not.toContain('og:image');
  });
});

describe.skipIf(!hayBuild)('SEO-6 — anti-tautologia', () => {
  it('los marcadores que buscan las guardas SI existen en dist', () => {
    // Sin esto, SEO-2 y SEO-5 pasarian tambien si el build no hubiera emitido
    // nada: una ausencia total satisface "no es HTML" de la peor manera posible.
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');

    expect(robots.trim().length).toBeGreaterThan(0);
    expect(readdirSync(ASSETS).filter((n) => n.endsWith('.js')).length).toBeGreaterThan(0);
    // Lo que cambia por pagina vive en el bundle...
    expect(bundleCompleto()).toContain('canonical');
    expect(bundleCompleto()).toContain('og:title');
    // ...y lo que vale para todo el sitio, en el `index.html`.
    expect(readFileSync(join(DIST, 'index.html'), 'utf8')).toContain('og:image');
  });
});

describe.skipIf(!hayBuild)('SEO-7 — metadatos de sitio en el index.html construido', () => {
  const html = () => readFileSync(join(DIST, 'index.html'), 'utf8');

  it('declara lo que vale para TODO el sitio, visible sin JavaScript', () => {
    // Es lo unico de Open Graph que un *crawler* sin JavaScript recibe, y es
    // informacion correcta para cualquier URL. Lo que cambia por pagina lo emite
    // `Seo` tras hidratar (limitacion **B-016-2**).
    const contenido = html();

    expect(contenido).toContain('property="og:site_name"');
    expect(contenido).toContain('property="og:image"');
    expect(contenido).toContain('name="twitter:card"');
  });

  it('og:image quedo resuelto a una URL absoluta, sin marcador sin sustituir', () => {
    const contenido = html();

    expect(contenido).not.toContain('%VITE_SITE_BASE_URL%');
    expect(contenido).toMatch(/property="og:image" content="https?:\/\/[^"]+\/og-imagen\.png"/);
  });

  it('las dimensiones declaradas coinciden con las constantes del codigo', () => {
    // Cierra el circulo: SEO-4 comprueba que el PNG mide lo que dicen las
    // constantes, y esto que el `index.html` declara esas mismas. Sin ello, el
    // marcado podria envejecer respecto del activo sin que nadie lo viera.
    const contenido = html();

    expect(contenido).toContain(`content="${String(ANCHO_DE_LA_IMAGEN_OG)}"`);
    expect(contenido).toContain(`content="${String(ALTO_DE_LA_IMAGEN_OG)}"`);
  });

  it('og:image no lleva firma ni caducidad (regla vigente de D-08)', () => {
    const contenido = html();

    expect(contenido).not.toContain('X-Amz');
    expect(contenido).not.toContain('Signature');
  });

  it('NO declara lo que cambia por pagina: eso lo emite `Seo` y duplicarlo seria un defecto', () => {
    // React 19 iza los metadatos pero **no deduplica**. Si `index.html` trajera
    // `description` u `og:title`, toda pagina tendria dos, con valores distintos.
    const contenido = html();

    expect(contenido).not.toContain('name="description"');
    expect(contenido).not.toContain('property="og:title"');
    expect(contenido).not.toContain('property="og:url"');
    expect(contenido).not.toContain('rel="canonical"');
  });
});
