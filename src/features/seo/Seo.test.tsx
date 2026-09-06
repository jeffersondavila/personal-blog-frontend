/**
 * Metadatos SEO por URL (`Task/016`, requisitos E-02, E-03, E-04, E-06, E-07).
 *
 * Estas pruebas miran **`document.head`**, no lo que el componente devuelve. Es
 * la diferencia entre comprobar el SEO y comprobar que se escribio codigo: React
 * 19 iza `<title>`, `<meta>` y `<link>` al `head`, y lo que un *crawler* con
 * JavaScript lee es el `head`, no el JSX.
 *
 * El JSON-LD **no** se iza —se comprobo al medir el *baseline*— y permanece en el
 * `body`, donde `application/ld+json` es igualmente valido.
 *
 * Lo que estas pruebas **no** pueden demostrar, y la ficha declara como
 * limitacion estructural (**B-016-2**): que un *crawler* **sin** JavaScript vea
 * nada de esto. Eso no se arregla escribiendo mejor este componente.
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Seo } from './Seo';
import { AppConfigContext } from '../../app/appConfigContext';
import type { AppConfig } from '../../lib/config/env';

const CONFIG: AppConfig = {
  apiBaseUrl: 'http://api.de-prueba.test',
  // Distinto del origen del API a proposito: si el componente los confundiera,
  // estas pruebas lo verian en lugar de coincidir por casualidad.
  siteBaseUrl: 'http://sitio.de-prueba.test',
};

function renderSeo(elemento: React.ReactElement) {
  return render(<AppConfigContext value={CONFIG}>{elemento}</AppConfigContext>);
}

function meta(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute('content') ?? null;
}

function enlace(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute('href') ?? null;
}

describe('Seo — E-02: title y description propios', () => {
  it('fija el titulo del documento con el sufijo del sitio', () => {
    renderSeo(<Seo titulo="Artículos" descripcion="Los artículos." ruta="/articulos" />);

    expect(document.title).toBe('Artículos · Blog personal');
  });

  it('con titulo nulo usa solo el nombre del sitio', () => {
    renderSeo(<Seo titulo={null} descripcion="Inicio." ruta="/" />);

    expect(document.title).toBe('Blog personal');
  });

  it('emite la descripcion en el head', () => {
    renderSeo(<Seo titulo="Artículos" descripcion="Los artículos." ruta="/articulos" />);

    expect(meta('meta[name="description"]')).toBe('Los artículos.');
  });

  it('con titulo indefinido no emite NADA: delega en quien renderice debajo', () => {
    // Es la semantica que `Task/014` fijo para `useDocumentTitle`: una pagina de
    // detalle que muestra la 404 no debe fijar sus propios metadatos.
    renderSeo(<Seo titulo={undefined} descripcion="No deberia aparecer." ruta="/articulos/x" />);

    expect(meta('meta[name="description"]')).toBeNull();
    expect(enlace('link[rel="canonical"]')).toBeNull();
    expect(meta('meta[property="og:title"]')).toBeNull();
  });
});

describe('Seo — E-04: canonical', () => {
  it('emite un canonical absoluto sobre el origen del SITIO', () => {
    renderSeo(<Seo titulo="Artículos" descripcion="d" ruta="/articulos" />);

    expect(enlace('link[rel="canonical"]')).toBe('http://sitio.de-prueba.test/articulos');
  });

  it('el canonical nunca apunta al origen del API', () => {
    renderSeo(<Seo titulo="Artículos" descripcion="d" ruta="/articulos" />);

    expect(enlace('link[rel="canonical"]')).not.toContain('api.de-prueba.test');
  });

  it('descarta el termino de busqueda de una ruta con consulta', () => {
    renderSeo(<Seo titulo="Resultados" descripcion="d" ruta="/buscar?q=docker" />);

    expect(enlace('link[rel="canonical"]')).toBe('http://sitio.de-prueba.test/buscar');
  });

  it('og:url de una ruta con consulta tampoco lleva el termino', () => {
    // `/buscar` se sirve con `noindex` (ver mas abajo), asi que en produccion no
    // emite `canonical`. Lo que se comprueba aqui es que **la forma** de la URL
    // canonica descarta la consulta, que es lo que decide `urlAbsoluta`.
    renderSeo(
      <Seo titulo="Resultados" descripcion="d" ruta="/buscar?q=docker" indexable={false} />,
    );

    expect(meta('meta[property="og:url"]')).toBe('http://sitio.de-prueba.test/buscar');
  });
});

describe('Seo — E-03: Open Graph', () => {
  it('emite el juego completo de etiquetas', () => {
    renderSeo(
      <Seo titulo="Hola" descripcion="Un artículo." ruta="/articulos/hola" tipo="article" />,
    );

    expect(meta('meta[property="og:type"]')).toBe('article');
    expect(meta('meta[property="og:title"]')).toBe('Hola · Blog personal');
    expect(meta('meta[property="og:description"]')).toBe('Un artículo.');
    expect(meta('meta[property="og:url"]')).toBe('http://sitio.de-prueba.test/articulos/hola');
  });

  it('NO emite lo que es constante por sitio: eso vive en index.html', () => {
    // React 19 iza los metadatos pero **no deduplica** —medido al implementar
    // esta tarea—, asi que emitir aqui `og:site_name`, `og:image` o
    // `twitter:card` produciria duplicados contradictorios con `index.html`.
    // El reparto tambien es lo que permite que un *crawler* SIN JavaScript
    // reciba al menos la imagen y el nombre del sitio.
    renderSeo(<Seo titulo="Hola" descripcion="d" ruta="/articulos/hola" />);

    expect(meta('meta[property="og:site_name"]')).toBeNull();
    expect(meta('meta[property="og:image"]')).toBeNull();
    expect(meta('meta[name="twitter:card"]')).toBeNull();
  });

  it('el tipo por defecto es website', () => {
    renderSeo(<Seo titulo="Contacto" descripcion="d" ruta="/contacto" />);

    expect(meta('meta[property="og:type"]')).toBe('website');
  });

  it('og:url y canonical coinciden', () => {
    renderSeo(<Seo titulo="Hola" descripcion="d" ruta="/articulos/hola" />);

    expect(meta('meta[property="og:url"]')).toBe(enlace('link[rel="canonical"]'));
  });
});

describe('Seo — og:image y la regla vigente de D-08', () => {
  it('`Seo` no expone ninguna puerta para inyectar una imagen', () => {
    // La garantia es ESTRUCTURAL: no hay prop de imagen, asi que ningun llamante
    // puede pasar un `access_url` caducable. Si algun dia se anadiera, esta
    // prueba obligaria a decidirlo a proposito y no por descuido.
    const elemento = <Seo titulo="Hola" descripcion="d" ruta="/articulos/hola" />;

    expect(Object.keys(elemento.props as object)).not.toContain('imagen');
    expect(Object.keys(elemento.props as object)).not.toContain('og:image');
  });

  it('nada de lo que emite lleva firma ni parametros de expiracion', () => {
    // Regla ya vigente de **D-08**: nunca se publica una URL prefirmada como
    // dato canonico. Un `access_url` caduca en 900 s y dejaria la vista previa
    // social rota dias despues de compartirla.
    renderSeo(<Seo titulo="Hola" descripcion="d" ruta="/articulos/hola" />);

    const emitido = document.head.innerHTML;

    expect(emitido).not.toContain('X-Amz');
    expect(emitido).not.toContain('Signature');
    expect(emitido).not.toContain('Expires');
  });
});

describe('Seo — E-06: robots', () => {
  it('por defecto una pagina publica es indexable y no emite meta robots', () => {
    renderSeo(<Seo titulo="Artículos" descripcion="d" ruta="/articulos" />);

    expect(meta('meta[name="robots"]')).toBeNull();
  });

  it('con indexable en false emite noindex y conserva follow', () => {
    renderSeo(<Seo titulo="Acceso" descripcion="d" ruta="/admin/acceso" indexable={false} />);

    expect(meta('meta[name="robots"]')).toBe('noindex,follow');
  });

  it('una pagina no indexable no emite canonical', () => {
    // Declarar canonica una URL que se pide no indexar es contradictorio.
    renderSeo(<Seo titulo="Acceso" descripcion="d" ruta="/admin/acceso" indexable={false} />);

    expect(enlace('link[rel="canonical"]')).toBeNull();
  });
});

describe('Seo — E-07: JSON-LD', () => {
  it('sin datos estructurados no emite ningun bloque', () => {
    renderSeo(<Seo titulo="Contacto" descripcion="d" ruta="/contacto" />);

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
  });

  it('emite un bloque por cada esquema recibido', () => {
    renderSeo(
      <Seo
        titulo="Hola"
        descripcion="d"
        ruta="/articulos/hola"
        jsonLd={[{ '@type': 'Article' }, { '@type': 'BreadcrumbList' }]}
      />,
    );

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
  });

  it('el bloque lleva el contexto de schema.org y es JSON valido', () => {
    renderSeo(
      <Seo
        titulo="Hola"
        descripcion="d"
        ruta="/articulos/hola"
        jsonLd={[{ '@type': 'Article' }]}
      />,
    );

    const bloque = document.querySelector('script[type="application/ld+json"]');
    const datos = JSON.parse(bloque?.textContent ?? '{}') as Record<string, unknown>;

    expect(datos['@context']).toBe('https://schema.org');
    expect(datos['@type']).toBe('Article');
  });

  it('una lista vacia no emite ningun bloque', () => {
    renderSeo(<Seo titulo="Hola" descripcion="d" ruta="/articulos/hola" jsonLd={[]} />);

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
  });
});
