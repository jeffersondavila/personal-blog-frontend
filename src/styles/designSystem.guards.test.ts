/**
 * Guardas del sistema de diseno.
 *
 * Comprueban propiedades del CSS **fuente** que ninguna prueba de componente
 * puede demostrar, porque JSDOM no aplica hojas de estilo. Son la evidencia de
 * tres reglas que, de otro modo, solo serian una promesa del reporte:
 *
 * - **T-01** ningun componente inventa un color;
 * - **T-03 / T-04** todo token referenciado existe de verdad;
 * - **F-03** ningun reset elimina el foco sin reemplazo.
 *
 * El valor de estas pruebas es que fallan **en el futuro**: el dia que alguien
 * pegue un `#3b82f6` en un componente o escriba `outline: none` para «limpiar»
 * un boton, la suite lo dice antes de la revision.
 */
/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { describe, expect, it } from 'vitest';

/*
 * Igual que en `contrast.test.ts`: el CSS se lee del disco porque la suite
 * corre con `css: false` y ni el import normal ni `?raw` devuelven contenido.
 * La referencia a los tipos de Node queda acotada a este archivo.
 */
const STYLES_DIR = join(cwd(), 'src', 'styles');
const COMPONENTS_DIR = join(cwd(), 'src', 'components');

const TOKENS_CSS = readFileSync(join(STYLES_DIR, 'tokens.css'), 'utf8');
const FOUNDATION_CSS = readFileSync(join(STYLES_DIR, 'foundation.css'), 'utf8');

interface CssFile {
  readonly name: string;
  readonly source: string;
}

/**
 * Todos los CSS Modules de los componentes, descubiertos recorriendo el
 * directorio.
 *
 * Se descubren en lugar de enumerarse: un componente nuevo entra en estas
 * guardas por el hecho de existir, sin que nadie tenga que acordarse de
 * anadirlo a una lista.
 */
function readComponentStyles(): readonly CssFile[] {
  return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(join(COMPONENTS_DIR, dir.name))
        .filter((file) => file.endsWith('.module.css'))
        .map((file) => ({
          name: `${dir.name}/${file}`,
          source: readFileSync(join(COMPONENTS_DIR, dir.name, file), 'utf8'),
        })),
    );
}

const COMPONENT_STYLES = readComponentStyles();

/** Elimina los comentarios para no analizar prosa explicativa como si fuera CSS. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('guardas del sistema de diseno', () => {
  it('encuentra los CSS Modules de los componentes', () => {
    // Si esta prueba falla, las demas estarian pasando en vacio.
    expect(COMPONENT_STYLES.length).toBeGreaterThanOrEqual(5);
  });

  describe('T-01 — ningun componente define un color propio', () => {
    it.each(COMPONENT_STYLES)('$name no contiene ningun color literal', ({ source }) => {
      const declarations = withoutComments(source);

      // Hexadecimales, funciones de color y nombres CSS habituales: todo lo que
      // permitiria saltarse la paleta del sistema.
      expect(declarations).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(declarations).not.toMatch(/\b(?:rgba?|hsla?|oklch|lab|color-mix)\s*\(/i);
      expect(declarations).not.toMatch(
        /:\s*(?:white|black|red|green|blue|gray|grey|silver|orange)\s*[;!]/i,
      );
    });
  });

  describe('T-03 / T-04 — todo token referenciado existe', () => {
    it.each(COMPONENT_STYLES)('$name solo usa tokens declarados', ({ source }) => {
      const referenced = [...source.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((match) => match[1]);

      expect(referenced.length).toBeGreaterThan(0);

      for (const token of referenced) {
        // Se excluyen las custom properties locales del propio modulo, si las
        // hubiera: solo se exige que los tokens del sistema existan.
        const declaredLocally = new RegExp(`${String(token)}:`).test(source);
        const declaredInTokens = new RegExp(`${String(token)}:`).test(TOKENS_CSS);

        expect(
          declaredInTokens || declaredLocally,
          `${String(token)} no esta declarado en tokens.css`,
        ).toBe(true);
      }
    });

    it('la fundacion global tampoco usa tokens inexistentes', () => {
      const referenced = [...FOUNDATION_CSS.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map(
        (match) => match[1],
      );

      expect(referenced.length).toBeGreaterThan(0);

      for (const token of referenced) {
        expect(
          new RegExp(`${String(token)}:`).test(TOKENS_CSS),
          `${String(token)} no esta declarado en tokens.css`,
        ).toBe(true);
      }
    });
  });

  describe('F-03 — el foco nunca se elimina sin reemplazo', () => {
    const ALL_CSS: readonly CssFile[] = [
      { name: 'styles/foundation.css', source: FOUNDATION_CSS },
      { name: 'styles/tokens.css', source: TOKENS_CSS },
      ...COMPONENT_STYLES,
    ];

    it.each(ALL_CSS)('$name no suprime el outline', ({ source }) => {
      const declarations = withoutComments(source);

      expect(declarations).not.toMatch(/outline\s*:\s*(?:none|0)\b/i);
    });

    it('existe una estrategia global de foco visible', () => {
      expect(FOUNDATION_CSS).toMatch(/:focus-visible\s*\{/);
      expect(FOUNDATION_CSS).toMatch(/outline:\s*var\(--focus-ring-width\)/);
      // El desplazamiento del anillo es lo que garantiza que se distinga del
      // relleno de un control: no es decoracion opcional.
      expect(FOUNDATION_CSS).toMatch(/outline-offset:\s*var\(--focus-ring-offset\)/);
    });

    it('ningun componente redefine el foco por su cuenta', () => {
      // La estrategia debe ser unica. Si un componente declarara la suya, el
      // sistema tendria dos comportamientos de foco distintos.
      for (const { name, source } of COMPONENT_STYLES) {
        expect(withoutComments(source), `${name} declara su propio :focus-visible`).not.toMatch(
          /:focus-visible/,
        );
      }
    });
  });

  describe('R-03 — el responsive no depende de dispositivos concretos', () => {
    it.each(COMPONENT_STYLES)('$name no usa media queries de ancho', ({ source }) => {
      // Las primitivas son intrinsecamente responsive (`clamp`, `min()`,
      // `flex-wrap`). Una media query de ancho aqui seria un salto atado a un
      // tamano de pantalla elegido a mano.
      expect(withoutComments(source)).not.toMatch(/@media[^{]*\b(?:min|max)-width\b/i);
    });

    it('el margen lateral es continuo, no escalonado', () => {
      expect(TOKENS_CSS).toMatch(/--layout-gutter:\s*clamp\(/);
    });
  });

  describe('accesibilidad del movimiento', () => {
    it('la fundacion respeta prefers-reduced-motion', () => {
      expect(FOUNDATION_CSS).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    });
  });
});
