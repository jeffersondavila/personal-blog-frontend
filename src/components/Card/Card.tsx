/**
 * Superficie del sistema de diseno.
 *
 * Agrupa contenido relacionado sobre un fondo diferenciado: elemento de
 * listado (USER_FLOWS A.2, A.4, A.6, A.7) y tarjeta de dashboard
 * (`MVP_SCOPE` §3.3).
 *
 * No tiene props de variante a proposito. Ningun consumidor actual necesita
 * mas de una densidad ni de un relleno, y anadir opciones que nadie usa es
 * justo lo que **M-06** prohibe. Cuando `Task/014` o `Task/015` demuestren que
 * hacen falta dos, se anaden entonces con su caso real.
 *
 * Tampoco impone semantica: renderiza un `<div>` sin rol. El elemento correcto
 * —`<article>` para un articulo, `<li>` dentro de una lista— lo decide la
 * pagina, porque **A-02** es de `Task/014`.
 */
import type { ComponentPropsWithRef } from 'react';

import styles from './Card.module.css';

export type CardProps = ComponentPropsWithRef<'div'>;

export function Card({ className, ...rest }: CardProps) {
  const classes = [styles['card'], className].filter(Boolean).join(' ');

  return <div {...rest} className={classes} />;
}
