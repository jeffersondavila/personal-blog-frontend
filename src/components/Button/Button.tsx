/**
 * Boton del sistema de diseno.
 *
 * Envuelve al `<button>` nativo sin sustituirlo: extiende sus props, de modo
 * que `type`, `disabled`, `form`, `name`, `value`, los manejadores y cualquier
 * atributo ARIA siguen funcionando igual. Eso no es una comodidad, es la
 * garantia de accesibilidad: un `<button>` real es enfocable, se activa con
 * Enter y con Espacio, y lo anuncian los lectores de pantalla sin que haya que
 * anadir ni un `role` ni un `tabIndex` (**A-01**).
 *
 * Por eso NUNCA se construye con `div` + `onClick`, y por eso `onClick` no es
 * obligatorio: un boton de envio dentro de un formulario no necesita ningun
 * manejador de React.
 *
 * El foco visible NO se declara aqui: lo aporta la regla global
 * `:focus-visible` de `foundation.css`, una sola vez para todo el sistema
 * (**A-06**).
 */
import type { ComponentPropsWithRef } from 'react';

import styles from './Button.module.css';

/**
 * Variantes disponibles.
 *
 * Solo dos, y cada una con consumidor real ya identificado en los flujos
 * canonicos:
 *
 * - `primary`: la accion principal de la pantalla. Reintentar una carga
 *   fallida (USER_FLOWS A.1, A.2), guardar, publicar.
 * - `secondary`: acciones de igual peso o de apoyo. Paginacion (A.2, A.4),
 *   cancelar, navegacion entre pasos.
 *
 * Una variante `danger` para confirmaciones destructivas (B.5, B.11) y una
 * variante silenciosa se anadiran cuando exista su consumidor real, en
 * `Task/015`. Los tokens de tono ya estan disponibles para entonces. Crear
 * ahora variantes sin consumidor seria justo lo que **M-06** prohibe.
 */
export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  readonly variant?: ButtonVariant;
}

export function Button({ variant = 'primary', type = 'button', className, ...rest }: ButtonProps) {
  /*
   * `type` recibe un valor por defecto porque el de HTML —`submit`— convierte
   * cualquier boton dentro de un formulario en un envio accidental. El
   * consumidor conserva el control absoluto: lo que pase gana siempre.
   */
  const classes = [styles['button'], styles[variant], className].filter(Boolean).join(' ');

  return <button {...rest} type={type} className={classes} />;
}
