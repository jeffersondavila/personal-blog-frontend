/**
 * Columna de contenido del sistema de diseno.
 *
 * Resuelve, una sola vez y para todo el producto, el ancho maximo del contenido
 * y su margen lateral. Sin el, cada pagina de `Task/014` y `Task/015` acabaria
 * inventando su propio `max-width`, que es exactamente la divergencia que esta
 * tarea existe para evitar.
 *
 * Renderiza un `<div>` sin ningun rol: los landmarks (`main`, `nav`,
 * `article`) los elige la pagina, porque el HTML semantico (**A-02**) es
 * responsabilidad de `Task/014`. Lo normal sera `<main><Container>…`.
 */
import type { ComponentPropsWithRef } from 'react';

import styles from './Container.module.css';

/**
 * Anchos disponibles, ambos con consumidor real:
 *
 * - `prose`: columna de lectura para texto corrido. Detalle de articulo y de
 *   review (USER_FLOWS A.3, A.5).
 * - `wide`: listados, rejillas y dashboard (A.2, A.4, A.6, A.7 y `MVP_SCOPE`
 *   §3.3).
 */
export type ContainerWidth = 'prose' | 'wide';

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  readonly width?: ContainerWidth;
}

export function Container({ width = 'prose', className, ...rest }: ContainerProps) {
  const classes = [styles['container'], styles[width], className].filter(Boolean).join(' ');

  return <div {...rest} className={classes} />;
}
