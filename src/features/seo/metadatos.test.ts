/**
 * Piezas puras de los metadatos SEO (`Task/016`).
 *
 * Se prueban aparte del componente porque son las que deciden la **forma** de
 * una URL canonica, y eso no necesita React ni un router.
 */
import { describe, expect, it } from 'vitest';

import { DESCRIPCION_DEL_SITIO, RUTA_DE_LA_IMAGEN_OG, urlAbsoluta } from './metadatos';

describe('urlAbsoluta', () => {
  it('une el origen y la ruta', () => {
    expect(urlAbsoluta('https://ejemplo.test', '/articulos')).toBe(
      'https://ejemplo.test/articulos',
    );
  });

  it('la raiz conserva su barra', () => {
    expect(urlAbsoluta('https://ejemplo.test', '/')).toBe('https://ejemplo.test/');
  });

  it('no duplica la barra cuando el origen ya la trae', () => {
    expect(urlAbsoluta('https://ejemplo.test/', '/articulos')).toBe(
      'https://ejemplo.test/articulos',
    );
  });

  it('conserva el prefijo de ruta del origen', () => {
    expect(urlAbsoluta('https://ejemplo.test/blog', '/articulos')).toBe(
      'https://ejemplo.test/blog/articulos',
    );
  });

  it('descarta la cadena de consulta: una consulta no es canonica', () => {
    expect(urlAbsoluta('https://ejemplo.test', '/buscar?q=docker')).toBe(
      'https://ejemplo.test/buscar',
    );
  });

  it('descarta el fragmento', () => {
    expect(urlAbsoluta('https://ejemplo.test', '/videos#intro')).toBe(
      'https://ejemplo.test/videos',
    );
  });

  it('codifica un slug con caracteres que no son seguros en una URL', () => {
    expect(urlAbsoluta('https://ejemplo.test', '/articulos/a b')).toBe(
      'https://ejemplo.test/articulos/a%20b',
    );
  });
});

describe('constantes del sitio', () => {
  it('la descripcion del sitio no esta vacia: es el respaldo de E-02', () => {
    expect(DESCRIPCION_DEL_SITIO.trim().length).toBeGreaterThan(0);
  });

  it('la imagen Open Graph es una ruta absoluta del propio sitio', () => {
    expect(RUTA_DE_LA_IMAGEN_OG.startsWith('/')).toBe(true);
  });

  it('la imagen Open Graph no lleva firma ni parametros de expiracion', () => {
    // Regla vigente de **D-08**: nunca se publica una URL prefirmada como dato
    // canonico. `og:image` es el caso que la ficha de `Task/016` declara.
    expect(RUTA_DE_LA_IMAGEN_OG).not.toContain('?');
    expect(RUTA_DE_LA_IMAGEN_OG).not.toContain('X-Amz');
  });
});
