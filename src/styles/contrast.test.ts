/**
 * Verificacion de contraste de la paleta real (**A-05**).
 *
 * Esta prueba NO conoce ningun color: lee los valores directamente de
 * `tokens.css` y calcula el ratio de cada par semantico. Es lo que convierte la
 * garantia de contraste en un hecho comprobable en lugar de una afirmacion del
 * reporte. Si alguien cambia un token y rompe WCAG 2.1 AA, la suite falla y
 * dice exactamente que par y con que ratio.
 *
 * La tabla `SEMANTIC_PAIRS` es la especificacion ejecutable: declara que
 * combinaciones el sistema promete que son legibles, y con que umbral.
 *
 * Alcance de la afirmacion: `Task/013` verifica **los pares que define**. NO
 * afirma que el producto entero cumpla AA — eso lo audita `Task/016` cuando
 * existan paginas reales.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../lib/color/contrast';

/*
 * El CSS se lee del disco, no se importa.
 *
 * `import './tokens.css'` no sirve: la suite corre con `css: false`
 * (`vite.config.ts`), de modo que Vitest no procesa las hojas de estilo y
 * tanto el modulo como su variante `?raw` llegan vacios. Leer el archivo es lo
 * unico que comprueba **el contenido que se publica de verdad**.
 *
 * La referencia a los tipos de Node esta acotada a este archivo a proposito:
 * evita anadir `node` a los `types` de `tsconfig.app.json`, que los pondria al
 * alcance de todo el codigo de navegador.
 */
const TOKENS_CSS = readFileSync(join(cwd(), 'src', 'styles', 'tokens.css'), 'utf8');

/**
 * Extrae el valor de un token de color de `tokens.css`.
 *
 * Falla en voz alta si el token no existe: un par que apunta a un token
 * inexistente es un error del sistema, no un caso a ignorar en silencio.
 */
function colorToken(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`).exec(TOKENS_CSS);

  if (match?.[1] === undefined) {
    throw new Error(`El token --${name} no existe en tokens.css o no es un color hexadecimal.`);
  }

  return match[1];
}

/**
 * Umbrales de WCAG 2.1 AA.
 *
 * `NON_TEXT` (3:1, criterio 1.4.11) aplica a lo que **identifica un control o
 * su estado** sin ser texto: el borde de un boton secundario, el anillo de
 * foco, el borde de un badge de tono.
 */
const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

interface SemanticPair {
  readonly description: string;
  readonly foreground: string;
  readonly background: string;
  readonly minimum: number;
}

const SEMANTIC_PAIRS: readonly SemanticPair[] = [
  // --- Texto sobre las dos superficies del sistema -------------------------
  {
    description: 'texto principal sobre el lienzo',
    foreground: 'color-text-primary',
    background: 'color-background',
    minimum: AA_TEXT,
  },
  {
    description: 'texto principal sobre superficie',
    foreground: 'color-text-primary',
    background: 'color-surface',
    minimum: AA_TEXT,
  },
  {
    description: 'texto secundario sobre el lienzo',
    foreground: 'color-text-secondary',
    background: 'color-background',
    minimum: AA_TEXT,
  },
  {
    description: 'texto secundario sobre superficie',
    foreground: 'color-text-secondary',
    background: 'color-surface',
    minimum: AA_TEXT,
  },

  // --- Interaccion ---------------------------------------------------------
  {
    description: 'enlace o accion sobre el lienzo',
    foreground: 'color-interactive',
    background: 'color-background',
    minimum: AA_TEXT,
  },
  {
    description: 'enlace o accion sobre superficie',
    foreground: 'color-interactive',
    background: 'color-surface',
    minimum: AA_TEXT,
  },
  {
    description: 'enlace o accion en hover sobre el lienzo',
    foreground: 'color-interactive-hover',
    background: 'color-background',
    minimum: AA_TEXT,
  },
  {
    description: 'texto del boton primario sobre su relleno',
    foreground: 'color-text-on-interactive',
    background: 'color-interactive',
    minimum: AA_TEXT,
  },
  {
    description: 'texto del boton primario sobre su relleno en hover',
    foreground: 'color-text-on-interactive',
    background: 'color-interactive-hover',
    minimum: AA_TEXT,
  },

  // --- Elementos no textuales que identifican un control (1.4.11) ----------
  {
    description: 'anillo de foco contra el lienzo',
    foreground: 'color-focus',
    background: 'color-background',
    minimum: AA_NON_TEXT,
  },
  {
    description: 'anillo de foco contra superficie',
    foreground: 'color-focus',
    background: 'color-surface',
    minimum: AA_NON_TEXT,
  },
  {
    description: 'borde que delimita un control, contra el lienzo',
    foreground: 'color-border-strong',
    background: 'color-background',
    minimum: AA_NON_TEXT,
  },
  {
    description: 'borde que delimita un control, contra superficie',
    foreground: 'color-border-strong',
    background: 'color-surface',
    minimum: AA_NON_TEXT,
  },

  // --- Tonos de estado: texto sobre su propia superficie -------------------
  {
    description: 'texto de exito sobre su superficie',
    foreground: 'color-success-text',
    background: 'color-success-surface',
    minimum: AA_TEXT,
  },
  {
    description: 'texto de aviso sobre su superficie',
    foreground: 'color-warning-text',
    background: 'color-warning-surface',
    minimum: AA_TEXT,
  },
  {
    description: 'texto de error sobre su superficie',
    foreground: 'color-danger-text',
    background: 'color-danger-surface',
    minimum: AA_TEXT,
  },

  // --- Tonos de estado: texto directamente sobre el lienzo -----------------
  // Un mensaje de error o de confirmacion no siempre lleva superficie propia.
  {
    description: 'texto de exito sobre el lienzo',
    foreground: 'color-success-text',
    background: 'color-background',
    minimum: AA_TEXT,
  },
  {
    description: 'texto de aviso sobre el lienzo',
    foreground: 'color-warning-text',
    background: 'color-background',
    minimum: AA_TEXT,
  },
  {
    description: 'texto de error sobre el lienzo',
    foreground: 'color-danger-text',
    background: 'color-background',
    minimum: AA_TEXT,
  },

  // --- Tonos de estado: borde del badge ------------------------------------
  {
    description: 'borde de exito contra el lienzo',
    foreground: 'color-success-border',
    background: 'color-background',
    minimum: AA_NON_TEXT,
  },
  {
    description: 'borde de aviso contra el lienzo',
    foreground: 'color-warning-border',
    background: 'color-background',
    minimum: AA_NON_TEXT,
  },
  {
    description: 'borde de error contra el lienzo',
    foreground: 'color-danger-border',
    background: 'color-background',
    minimum: AA_NON_TEXT,
  },
];

describe('contraste de los tokens de color', () => {
  it.each(SEMANTIC_PAIRS)(
    'cumple el umbral: $description (minimo $minimum:1)',
    ({ foreground, background, minimum }) => {
      const ratio = contrastRatio(colorToken(foreground), colorToken(background));

      expect(ratio).toBeGreaterThanOrEqual(minimum);
    },
  );

  it('declara al menos un par por cada tono de estado del sistema', () => {
    // Guarda contra el olvido: anadir un tono nuevo a `tokens.css` sin declarar
    // su par de contraste dejaria un color sin verificar.
    for (const tone of ['success', 'warning', 'danger']) {
      const declared = SEMANTIC_PAIRS.some(
        (pair) => pair.foreground.includes(tone) || pair.background.includes(tone),
      );

      expect(declared, `el tono "${tone}" no tiene ningun par de contraste declarado`).toBe(true);
    }
  });
});
