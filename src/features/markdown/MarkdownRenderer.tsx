/**
 * Renderizador Markdown del proyecto (ADR-005, requisito S-03).
 *
 * Pipeline único, reutilizable por la vista previa de `Task/015`:
 *
 *     Markdown → react-markdown → árbol React → rehype-sanitize → render permitido
 *
 * Tres capas de defensa, cada una independiente de las otras:
 *
 * 1. **No se interpreta HTML crudo** (`skipHtml`). ADR-005, decision 5: no se
 *    acepta HTML libre dentro del Markdown. Un `<script>`, un `<iframe>` o un
 *    atributo `onerror` escritos en el contenido simplemente desaparecen; no
 *    hace falta `rehype-raw` y no se usa.
 * 2. **Lista de permitidos** (`rehype-sanitize` con el esquema explicito de
 *    `esquema.ts`), decision 4 del ADR: elementos y atributos permitidos, nunca
 *    una lista de prohibidos. Los protocolos de `href` y `src` estan acotados.
 * 3. **El resultado es un arbol React**, no una cadena: nunca hay
 *    `dangerouslySetInnerHTML`, asi que no existe el camino por el que un
 *    fallo de sanitizacion acabaria en el documento.
 *
 * Enlaces (decision D-014-L): se distinguen **internos** —rutas del propio
 * sitio, que navegan con el router—, **externos** `http`/`https` —que pasan
 * por `ExternalLink` y cumplen S-12—, anclas y `mailto:`. Un destino sin
 * protocolo permitido no produce ningun enlace: queda el texto (*fail-closed*).
 *
 * Encabezados: el `h1` de la pagina es el titulo del contenido, asi que los
 * encabezados del Markdown bajan un nivel (`#` → `h2`). El autor escribe con
 * naturalidad y la jerarquia de la pagina se mantiene coherente (A-02).
 *
 * `react-markdown` pasa a cada componente el nodo `hast` de origen en la prop
 * `node`; se descarta explicitamente para que no llegue al DOM.
 */
import type { ComponentPropsWithoutRef } from 'react';
import Markdown, { type Components, type ExtraProps } from 'react-markdown';
import { Link } from 'react-router';
import rehypeSanitize from 'rehype-sanitize';

import { ESQUEMA_DE_SANITIZACION } from './esquema';
import styles from './markdown.module.css';
import { ExternalLink } from '../../components';
import { esDestinoExternoPermitido } from '../../lib/enlaces';

type PropsDeEnlace = ComponentPropsWithoutRef<'a'> & ExtraProps;
type PropsDeImagen = ComponentPropsWithoutRef<'img'> & ExtraProps;
type PropsDeEncabezado = ComponentPropsWithoutRef<'h2'> & ExtraProps;

/** Enlace del contenido, clasificado por destino. */
export function EnlaceDeMarkdown({ href, children, node, ...rest }: PropsDeEnlace) {
  void node;
  if (href === undefined || href.trim() === '') {
    return <span>{children}</span>;
  }
  if (href.startsWith('#')) {
    return (
      <a {...rest} href={href}>
        {children}
      </a>
    );
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link {...rest} to={href}>
        {children}
      </Link>
    );
  }
  if (href.startsWith('mailto:')) {
    return (
      <a {...rest} href={href}>
        {children}
      </a>
    );
  }
  if (esDestinoExternoPermitido(href)) {
    return (
      <ExternalLink {...rest} href={href}>
        {children}
      </ExternalLink>
    );
  }
  return <span>{children}</span>;
}

/** Imagen del contenido: sin `src` permitido no hay imagen; siempre en diferido. */
function ImagenDeMarkdown({ src, alt, node, ...rest }: PropsDeImagen) {
  void node;
  if (typeof src !== 'string' || src === '') {
    return null;
  }
  return <img {...rest} src={src} alt={alt ?? ''} loading="lazy" />;
}

/** Fabrica de encabezados un nivel por debajo del escrito. */
function encabezado(nivel: 2 | 3 | 4 | 5 | 6) {
  const Etiqueta = `h${String(nivel)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return function Encabezado({ node, ...props }: PropsDeEncabezado) {
    void node;
    return <Etiqueta {...props} />;
  };
}

const COMPONENTES: Components = {
  a: EnlaceDeMarkdown,
  img: ImagenDeMarkdown,
  h1: encabezado(2),
  h2: encabezado(3),
  h3: encabezado(4),
  h4: encabezado(5),
  h5: encabezado(6),
  h6: encabezado(6),
};

const PLUGINS_REHYPE: NonNullable<ComponentPropsWithoutRef<typeof Markdown>['rehypePlugins']> = [
  [rehypeSanitize, ESQUEMA_DE_SANITIZACION],
];

export interface MarkdownRendererProps {
  /** Markdown **fuente**, tal como lo entrega el API. */
  readonly markdown: string;
}

export function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  return (
    <div className={styles['contenido']}>
      <Markdown skipHtml rehypePlugins={PLUGINS_REHYPE} components={COMPONENTES}>
        {markdown}
      </Markdown>
    </div>
  );
}

export default MarkdownRenderer;
