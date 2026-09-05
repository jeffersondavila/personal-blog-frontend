/**
 * Enlace a un sitio de terceros (`Task/014`).
 *
 * Es el unico punto donde se cumple **S-12**: todo enlace externo lleva
 * `rel="noopener noreferrer"`. Con un componente, cumplirlo es mas facil que
 * incumplirlo; sin el, cada consumidor tendria que recordarlo.
 *
 * Decision D-014-L: abre en la **misma pestana**. Abrir pestanas nuevas sin
 * avisar desorienta a quien navega con lector de pantalla o teclado, y S-12 se
 * cumple igual. `noreferrer` sigue teniendo efecto: no se filtra la URL de
 * origen al tercero.
 *
 * Solo `http:` y `https:`. Un `href` con cualquier otro esquema —`javascript:`,
 * `data:`, `ftp:`— o que no sea una URL absoluta **no produce un enlace**: se
 * muestra el texto y nada mas (*fail-closed*). El destino llega del contenido
 * publicado, que el administrador controla, pero un dato que viaja por la API
 * se trata como dato, no como codigo.
 */
import type { ComponentPropsWithRef } from 'react';

import { esDestinoExternoPermitido } from '../../lib/enlaces';

export interface ExternalLinkProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'href' | 'rel' | 'target'
> {
  readonly href: string;
}

export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  if (!esDestinoExternoPermitido(href)) {
    return <span {...rest}>{children}</span>;
  }

  return (
    <a {...rest} href={href} rel="noopener noreferrer">
      {children}
    </a>
  );
}
