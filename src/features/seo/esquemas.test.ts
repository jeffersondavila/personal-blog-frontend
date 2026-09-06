/**
 * Datos estructurados JSON-LD (`Task/016`, requisito E-07).
 *
 * La regla que gobierna estas pruebas: **ninguna propiedad se emite si el DTO
 * publico real no la alimenta**. Un JSON-LD con datos inventados es peor que
 * ninguno, porque afirma ante un buscador algo que el sitio no sabe.
 *
 * Lo habilita una garantia del contrato: `api-contracts.md` seccion 14.5 exige,
 * **al publicar**, `title`, `slug` y una descripcion SEO resoluble, y para una
 * review ademas `book_title`, `book_author` y `rating`. Todo contenido publicado
 * trae, por tanto, lo que estos esquemas necesitan.
 */
import { describe, expect, it } from 'vitest';

import {
  esquemaDeArticulo,
  esquemaDeMigasDePan,
  esquemaDePersona,
  esquemaDeReview,
  esquemaDelSitio,
} from './esquemas';
import { perfil, postDetallado, reviewDetallada } from '../../test/fixtures';

const ORIGEN = 'https://ejemplo.test';

describe('esquemaDelSitio — WebSite', () => {
  it('declara el tipo, el nombre y la URL', () => {
    const esquema = esquemaDelSitio(ORIGEN);

    expect(esquema['@type']).toBe('WebSite');
    expect(esquema['name']).toBe('Blog personal');
    expect(esquema['url']).toBe('https://ejemplo.test/');
  });

  it('declara la accion de busqueda sobre la ruta que existe de verdad', () => {
    const esquema = esquemaDelSitio(ORIGEN);
    const accion = esquema['potentialAction'] as Record<string, unknown>;

    expect(accion['@type']).toBe('SearchAction');
    expect(accion['target']).toContain('/buscar?q=');
    expect(accion['query-input']).toBe('required name=search_term_string');
  });
});

describe('esquemaDePersona — Person', () => {
  it('usa el nombre real del perfil', () => {
    const esquema = esquemaDePersona(perfil(), ORIGEN);

    expect(esquema).not.toBeNull();
    expect(esquema?.['@type']).toBe('Person');
    expect(esquema?.['name']).toBe(perfil().full_name);
  });

  it('sin perfil no emite nada', () => {
    // `GET /profile` responde 404 mientras no haya semilla (D-009-N).
    expect(esquemaDePersona(null, ORIGEN)).toBeNull();
  });

  it('los enlaces sociales van en sameAs', () => {
    const conRedes = { ...perfil(), social_links: [{ label: 'GitHub', url: 'https://gh.test/a' }] };

    const esquema = esquemaDePersona(conRedes, ORIGEN);

    expect(esquema?.['sameAs']).toStrictEqual(['https://gh.test/a']);
  });

  it('sin enlaces sociales omite sameAs en lugar de emitir una lista vacia', () => {
    const esquema = esquemaDePersona({ ...perfil(), social_links: [] }, ORIGEN);

    expect(esquema).not.toBeNull();
    expect('sameAs' in (esquema as object)).toBe(false);
  });

  it('NO emite jobTitle: headline es un lema, no un cargo', () => {
    const esquema = esquemaDePersona(perfil(), ORIGEN);

    expect('jobTitle' in (esquema as object)).toBe(false);
  });

  it('NO emite image: la foto solo existe como enlace caducable (D-08)', () => {
    const esquema = esquemaDePersona(perfil(), ORIGEN);

    expect('image' in (esquema as object)).toBe(false);
    expect(JSON.stringify(esquema)).not.toContain('X-Amz');
  });
});

describe('esquemaDeArticulo — Article', () => {
  const contenido = postDetallado();

  it('declara headline con el titulo real', () => {
    const esquema = esquemaDeArticulo({
      contenido,
      url: `${ORIGEN}/articulos/${contenido.slug}`,
    });

    expect(esquema?.['@type']).toBe('Article');
    expect(esquema?.['headline']).toBe(contenido.title);
  });

  it('la descripcion sale de seo_description con respaldo en summary', () => {
    const conSeo = { ...contenido, seo_description: 'La SEO.', summary: 'El resumen.' };
    const sinSeo = { ...contenido, seo_description: null, summary: 'El resumen.' };

    expect(esquemaDeArticulo({ contenido: conSeo, url: 'u' })?.['description']).toBe('La SEO.');
    expect(esquemaDeArticulo({ contenido: sinSeo, url: 'u' })?.['description']).toBe('El resumen.');
  });

  it('omite description cuando no hay ninguna de las dos', () => {
    const sinNada = { ...contenido, seo_description: null, summary: null };

    expect('description' in (esquemaDeArticulo({ contenido: sinNada, url: 'u' }) as object)).toBe(
      false,
    );
  });

  it('datePublished sale de published_at', () => {
    const esquema = esquemaDeArticulo({ contenido, url: 'u' });

    expect(esquema?.['datePublished']).toBe(contenido.published_at);
  });

  it('omite datePublished si published_at es nulo', () => {
    const sinFecha = { ...contenido, published_at: null };

    expect(
      'datePublished' in (esquemaDeArticulo({ contenido: sinFecha, url: 'u' }) as object),
    ).toBe(false);
  });

  it('NO emite dateModified: updated_at no esta en el DTO publico', () => {
    const esquema = esquemaDeArticulo({ contenido, url: 'u' });

    expect('dateModified' in (esquema as object)).toBe(false);
  });

  it('NO emite image desde la portada: access_url caduca (D-08, B-016-1)', () => {
    const esquema = esquemaDeArticulo({ contenido, url: 'u' });

    expect('image' in (esquema as object)).toBe(false);
    expect(JSON.stringify(esquema)).not.toContain('X-Amz');
    expect(JSON.stringify(esquema)).not.toContain('access_url');
  });

  it('las etiquetas van en keywords, y sin etiquetas se omite', () => {
    const conTags = {
      ...contenido,
      tags: [{ slug: 'docker', name: 'Docker', description: null }],
    };

    expect(esquemaDeArticulo({ contenido: conTags, url: 'u' })?.['keywords']).toBe('Docker');
    expect(
      'keywords' in
        (esquemaDeArticulo({ contenido: { ...contenido, tags: [] }, url: 'u' }) as object),
    ).toBe(false);
  });

  it('fail-closed: sin titulo no se emite el esquema', () => {
    const sinTitulo = { ...contenido, title: '   ' };

    expect(esquemaDeArticulo({ contenido: sinTitulo, url: 'u' })).toBeNull();
  });
});

describe('esquemaDeReview — Review de un Book', () => {
  const review = reviewDetallada();

  it('declara la review con el libro y la valoracion', () => {
    const completa = { ...review, book_title: 'Clean Code', book_author: 'R. Martin', rating: 4 };

    const esquema = esquemaDeReview({ contenido: completa, url: 'u' });

    expect(esquema?.['@type']).toBe('Review');
    const libro = esquema?.['itemReviewed'] as Record<string, unknown>;
    expect(libro['@type']).toBe('Book');
    expect(libro['name']).toBe('Clean Code');
    expect((libro['author'] as Record<string, unknown>)['name']).toBe('R. Martin');
  });

  it('la escala de la valoracion es 1..5, que es la decision D-D del modelo', () => {
    const completa = { ...review, book_title: 'C', book_author: 'A', rating: 4 };

    const nota = esquemaDeReview({ contenido: completa, url: 'u' })?.['reviewRating'] as Record<
      string,
      unknown
    >;

    expect(nota['@type']).toBe('Rating');
    expect(nota['ratingValue']).toBe(4);
    expect(nota['bestRating']).toBe(5);
    expect(nota['worstRating']).toBe(1);
  });

  it.each([
    ['sin titulo del libro', { book_title: null }],
    ['sin autor del libro', { book_author: null }],
    ['sin valoracion', { rating: null }],
  ])('fail-closed: %s no se emite el esquema completo', (_caso, hueco) => {
    const incompleta = { ...review, book_title: 'C', book_author: 'A', rating: 4, ...hueco };

    expect(esquemaDeReview({ contenido: incompleta, url: 'u' })).toBeNull();
  });

  it('NO emite image de la portada', () => {
    const completa = { ...review, book_title: 'C', book_author: 'A', rating: 4 };

    expect(JSON.stringify(esquemaDeReview({ contenido: completa, url: 'u' }))).not.toContain(
      'X-Amz',
    );
  });
});

describe('esquemaDeMigasDePan — BreadcrumbList', () => {
  it('describe la jerarquia real de rutas', () => {
    const esquema = esquemaDeMigasDePan([
      { nombre: 'Artículos', url: `${ORIGEN}/articulos` },
      { nombre: 'Hola', url: `${ORIGEN}/articulos/hola` },
    ]);

    expect(esquema['@type']).toBe('BreadcrumbList');
    const elementos = esquema['itemListElement'] as Record<string, unknown>[];
    expect(elementos).toHaveLength(2);
    expect(elementos[0]?.['position']).toBe(1);
    expect(elementos[0]?.['name']).toBe('Artículos');
    expect(elementos[1]?.['position']).toBe(2);
    expect(elementos[1]?.['item']).toBe(`${ORIGEN}/articulos/hola`);
  });
});
