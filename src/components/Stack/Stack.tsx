/**
 * Primitiva de separacion del sistema de diseno.
 *
 * Es el unico mecanismo con el que se separa contenido. `CONTRIBUTING.md`
 * seccion 6 prohibe los «valores magicos de espaciado»: `Stack` es lo que hace
 * que cumplirlo sea mas facil que incumplirlo, porque la alternativa —escribir
 * un margen a mano— deja de ser necesaria.
 *
 * Cubre los dos ejes en un solo componente en lugar de repartirlos en `Stack`
 * y `Cluster`. Son la misma decision —«separa estos elementos con un paso de
 * la escala»— y separarlos obligaria al consumidor a recordar dos nombres para
 * elegir una direccion.
 */
import type { ComponentPropsWithRef } from 'react';

import styles from './Stack.module.css';

/**
 * Pasos de la escala de espaciado.
 *
 * Se exponen los siete de `tokens.css` y ninguno mas: quien necesite una
 * separacion distinta debe anadirla a la escala, no inventarla en su hoja de
 * estilos.
 */
export type StackGap = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type StackDirection = 'vertical' | 'horizontal';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

export interface StackProps extends ComponentPropsWithRef<'div'> {
  /** Eje en el que se disponen los hijos. Vertical por defecto. */
  readonly direction?: StackDirection;
  /** Separacion entre hijos, tomada de la escala del sistema. */
  readonly gap?: StackGap;
  /** Alineacion en el eje transversal. */
  readonly align?: StackAlign;
  /**
   * Permite que los hijos pasen a la linea siguiente cuando no caben.
   *
   * Es la pieza responsive de esta primitiva: una fila de etiquetas
   * (USER_FLOWS A.9) o de acciones se reordena sola en pantalla estrecha, sin
   * ninguna media query.
   */
  readonly wrap?: boolean;
}

export function Stack({
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  wrap = false,
  className,
  ...rest
}: StackProps) {
  const classes = [
    styles['stack'],
    styles[direction],
    // Los pasos de la escala empiezan por digito y una clase CSS no puede: de
    // ahi el prefijo `gap-`, que ademas deja claro que categoria es.
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    wrap ? styles['wrap'] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div {...rest} className={classes} />;
}
