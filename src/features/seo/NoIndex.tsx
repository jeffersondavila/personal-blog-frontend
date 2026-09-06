/**
 * Pide que la superficie no se indexe (`Task/016`, requisito E-06).
 *
 * Se usa donde no hay nada que compartir ni describir —el panel administrativo—,
 * a diferencia de `Seo`, que ademas emite descripcion, canonical y Open Graph.
 *
 * `follow` y no `nofollow`: se pide no indexar **esta** pagina, no dejar de
 * seguir los enlaces que lleva.
 *
 * Alcance real, sin exagerar
 * --------------------------
 *
 * Esta etiqueta existe **despues** de hidratar. Un *crawler* que no ejecuta
 * JavaScript no la ve, y `robots.txt` cubre el rastreo pero **no** garantiza la
 * no indexacion de una URL enlazada desde fuera. La garantia sin JavaScript
 * exigiria la cabecera `X-Robots-Tag`, que es de `Task/018` (**S-05**).
 *
 * Por eso **E-06 queda PARCIAL** en `Task/016`, y esa limitacion esta declarada
 * en la ficha en lugar de disimulada aqui.
 */
export function NoIndex() {
  return <meta name="robots" content="noindex,follow" />;
}
