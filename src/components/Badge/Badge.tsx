/**
 * Etiqueta breve del sistema de diseno — y la garantia **A-07**.
 *
 * Dos consumidores canonicos:
 *
 * - Etiquetas del contenido publico (USER_FLOWS A.2 y A.9), en tono neutro.
 * - Estados de contenido del panel (`MVP_SCOPE` §3.2: `draft`, `published`,
 *   `archived`), que `Task/015` mapeara sobre estos tonos.
 *
 * ## Por que el color nunca es la unica senal
 *
 * El requisito **A-07** —«sin dependencia exclusiva del color»— no se cumple
 * con buena intencion, se cumple con estructura. Aqui hay tres capas:
 *
 * 1. **Texto obligatorio.** `children` es requerido por tipos: un badge sin
 *    texto no compila. Quien no distinga colores lee el significado igual.
 * 2. **Silueta propia por tono.** Cada tono no neutro anade un glifo cuya
 *    *forma exterior* es distinta —circulo, triangulo, octogono—, no solo su
 *    color. Se distinguen en escala de grises y en una impresion en blanco y
 *    negro.
 * 3. **Color**, que llega el ultimo y solo refuerza.
 *
 * El glifo es `aria-hidden`: la tecnologia asistiva ya recibe el significado
 * por el texto, y anunciarlo dos veces solo estorbaria.
 *
 * El tono `neutral` no lleva glifo **a proposito**: no senala ningun estado,
 * asi que no hay nada que distinguir. Anadirle un icono decorativo seria ruido.
 */
import type { ComponentPropsWithRef, ReactNode } from 'react';

import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  readonly tone?: BadgeTone;
  /** Obligatorio: es el portador principal del significado (**A-07**). */
  readonly children: ReactNode;
}

/**
 * Glifos por tono.
 *
 * Trazo y no relleno para que se lean bien a tamano pequeno. `focusable`
 * desactivado porque Internet Explorer y algunos motores heredados hacen
 * enfocable un `<svg>` dentro de un elemento interactivo, lo que introduciria
 * una parada de tabulacion sin sentido.
 */
const TONE_GLYPHS: Partial<Record<BadgeTone, ReactNode>> = {
  // Circulo con comprobacion.
  success: (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <path d="m5.25 8.25 1.9 1.9 3.6-3.9" />
    </>
  ),
  // Triangulo con signo de admiracion.
  warning: (
    <>
      <path d="M8 2.1 14.6 13.4H1.4z" />
      <path d="M8 6.3v3.1" />
      <path d="M8 11.6h.01" />
    </>
  ),
  // Octogono con aspa.
  danger: (
    <>
      <path d="M5.6 1.6h4.8l3.9 3.9v4.8l-3.9 3.9H5.6l-3.9-3.9V5.5z" />
      <path d="m6 6 4 4" />
      <path d="m10 6-4 4" />
    </>
  ),
};

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  const glyph = TONE_GLYPHS[tone];
  const classes = [styles['badge'], styles[tone], className].filter(Boolean).join(' ');

  return (
    <span {...rest} className={classes}>
      {glyph !== undefined && (
        <svg
          className={styles['glyph']}
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          {glyph}
        </svg>
      )}
      {children}
    </span>
  );
}
