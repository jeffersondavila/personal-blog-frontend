/**
 * Clasificacion de destinos de enlace (S-12, decision D-014-L).
 *
 * Utilidad pura, sin React: la usan `ExternalLink` y el renderizador Markdown.
 * Solo `http:` y `https:` cuentan como destino externo permitido; cualquier
 * otro esquema —`javascript:`, `data:`, `ftp:`— o una cadena que no sea una URL
 * absoluta se rechaza (*fail-closed*).
 */

const ESQUEMAS_PERMITIDOS = new Set(['http:', 'https:']);

/** Indica si el destino es una URL absoluta con un esquema permitido. */
export function esDestinoExternoPermitido(href: string): boolean {
  try {
    return ESQUEMAS_PERMITIDOS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}
