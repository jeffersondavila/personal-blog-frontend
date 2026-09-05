/**
 * Calculo de contraste segun WCAG 2.1.
 *
 * Existe para que la garantia de contraste del sistema de diseno (**A-05**) sea
 * verificable y no una opinion: `src/styles/contrast.test.ts` lee los valores
 * reales de `tokens.css` y comprueba con estas funciones que cada par semantico
 * declarado alcanza su umbral. Si alguien cambia un color y rompe AA, la suite
 * falla.
 *
 * Por que no una dependencia: la formula son diez lineas, esta congelada en el
 * estandar desde 2008 y solo se aplica a colores hexadecimales estaticos. Una
 * libreria anadiria superficie de mantenimiento y peso para resolver algo que
 * no cambia. La decision, con sus alternativas, es D-13.8 de la ficha.
 *
 * Alcance deliberado: **solo hexadecimal opaco**. No se manejan alfa, `rgb()`,
 * `hsl()` ni espacios de color modernos porque los tokens no los usan; si algun
 * dia los usan, esta utilidad debera crecer con su prueba correspondiente en
 * lugar de adivinar ahora.
 *
 * `lib` no importa de ninguna otra carpeta
 * (`software-architecture.md` §4.3): estas funciones son puras y sin efectos.
 */

/** `#rgb` o `#rrggbb`, en cualquier combinacion de mayusculas y minusculas. */
const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Convierte un canal sRGB de 0–255 a su valor lineal.
 *
 * La correccion de gamma es imprescindible: promediar los canales tal cual
 * daria una luminancia equivocada y, con ella, ratios que dejarian pasar
 * combinaciones que no cumplen.
 */
function linearizeChannel(value: number): number {
  const normalized = value / 255;

  return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/** Descompone un color hexadecimal en sus tres canales de 0–255. */
function parseHex(color: string): readonly [number, number, number] {
  if (!HEX_PATTERN.test(color)) {
    throw new Error(`Color no valido: "${color}". Se espera notacion hexadecimal #rgb o #rrggbb.`);
  }

  const digits = color.slice(1);
  // La notacion corta duplica cada digito: `#abc` equivale a `#aabbcc`.
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Luminancia relativa de un color, entre 0 (negro) y 1 (blanco).
 *
 * Los coeficientes ponderan cada canal segun la sensibilidad del ojo humano:
 * el verde pesa mucho mas que el azul.
 */
export function relativeLuminance(color: string): number {
  const [red, green, blue] = parseHex(color);

  return (
    0.2126 * linearizeChannel(red) +
    0.7152 * linearizeChannel(green) +
    0.0722 * linearizeChannel(blue)
  );
}

/**
 * Ratio de contraste entre dos colores, de 1 (identicos) a 21 (negro y blanco).
 *
 * Es simetrico: el orden de los argumentos no altera el resultado, porque la
 * formula siempre pone la luminancia mayor en el numerador.
 *
 * Umbrales de WCAG 2.1 nivel AA relevantes para este proyecto:
 *
 * - **4.5:1** texto normal sobre su fondo.
 * - **3:1** texto grande y elementos NO textuales que identifican un control
 *   (criterio 1.4.11): el borde de un boton secundario, el anillo de foco.
 */
export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);

  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}
