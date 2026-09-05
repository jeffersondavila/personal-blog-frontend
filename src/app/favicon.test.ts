/**
 * Favicon (decision D-014-E): existe, esta enlazado desde `index.html` y sus
 * colores son exactamente los de `tokens.css`, para que el asset no se
 * convierta en una segunda paleta.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(join(cwd(), 'index.html'), 'utf8');
const RUTA_FAVICON = join(cwd(), 'public', 'favicon.svg');
const TOKENS_CSS = readFileSync(join(cwd(), 'src', 'styles', 'tokens.css'), 'utf8');

describe('favicon', () => {
  it('index.html enlaza el favicon SVG real y ya no declara el recurso vacio', () => {
    expect(INDEX_HTML).toMatch(/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/);
    expect(INDEX_HTML).not.toContain('href="data:,"');
  });

  it('el archivo existe y es un SVG sin script ni texto', () => {
    expect(existsSync(RUTA_FAVICON)).toBe(true);
    const svg = readFileSync(RUTA_FAVICON, 'utf8');

    expect(svg).toMatch(/<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).not.toMatch(/<script/i);
    // Sin iniciales ni nombre: es una marca geometrica, no un logotipo.
    expect(svg).not.toMatch(/<text/i);
  });

  it('solo usa colores que existen en tokens.css: no es una segunda paleta', () => {
    const svg = readFileSync(RUTA_FAVICON, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const colores = [...svg.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase());

    expect(colores.length).toBeGreaterThan(0);
    for (const color of colores) {
      expect(TOKENS_CSS.toLowerCase(), `${color} no es un token`).toContain(color);
    }
  });
});
