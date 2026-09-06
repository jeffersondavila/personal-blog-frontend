/**
 * Piezas puras de los metadatos SEO (`Task/016`).
 *
 * Viven aparte del componente porque deciden la **forma** de una URL canonica, y
 * eso no necesita React ni un router: asi se prueban solas y no pueden divergir
 * entre `canonical` y `og:url`, que es un defecto clasico de SEO.
 */
import { NOMBRE_DEL_SITIO } from '../../lib/site';

/**
 * Descripcion de respaldo del sitio.
 *
 * La usan las superficies que **no** tienen una descripcion propia procedente
 * del API: la portada, los listados y la 404. No describe al autor —eso llega
 * por `GET /profile`, que puede no existir todavia (D-009-N)— sino al sitio.
 */
export const DESCRIPCION_DEL_SITIO =
  'Artículos, reviews de libros, videos y proyectos sobre desarrollo de software, ' +
  'infraestructura y aprendizaje continuo.';

/**
 * Descripciones propias de las superficies que **no** las reciben del API.
 *
 * Los listados, la busqueda, el contacto y la 404 no tienen un campo
 * `seo_description` que consultar: describen una **seccion del sitio**, no una
 * pieza de contenido. Se escriben aqui, una vez, en lugar de repetirse por
 * pagina, que es como acaban divergiendo.
 *
 * Los **detalles** no aparecen en esta lista: su descripcion sale de
 * `seo_description ?? summary`, y `api-contracts.md` §14.5 garantiza que un
 * contenido publicado tiene una de las dos.
 */
export const DESCRIPCION_DE_ARTICULOS =
  'Artículos sobre desarrollo de software, infraestructura y las decisiones ' +
  'técnicas detrás de cada proyecto.';

export const DESCRIPCION_DE_REVIEWS =
  'Reviews de libros técnicos y de divulgación, con lo que aporta cada uno y a quién le sirve.';

export const DESCRIPCION_DE_VIDEOS =
  'Videos y grabaciones sobre desarrollo, herramientas y experimentos técnicos.';

export const DESCRIPCION_DE_PROYECTOS =
  'Proyectos y experimentos técnicos, con su estado, sus tecnologías y su código cuando existe.';

export const DESCRIPCION_DE_QUIEN_SOY =
  'Quién escribe este blog: trayectoria, intereses técnicos y dónde encontrarme.';

export const DESCRIPCION_DE_CONTACTO = 'Cómo ponerse en contacto conmigo y dónde encontrarme.';

export const DESCRIPCION_DE_LA_BUSQUEDA =
  'Busca entre los artículos, reviews, videos y proyectos publicados en el sitio.';

export const DESCRIPCION_DE_LA_404 =
  'La dirección solicitada no existe en este sitio. Desde aquí se puede volver al inicio.';

/**
 * Imagen de Open Graph: **activo estatico del propio sitio** (decision D-016-A).
 *
 * Es la unica forma de satisfacer *«`og:image` con URL estable y no expirable»*
 * sin decidir nada de lo que **D-08** reserva a `Task/030`. Un archivo de
 * `public/` no caduca, no exige autenticacion y su semantica de cache es la de
 * `dist/`, ya fijada por `Task/007`.
 *
 * **Nunca se usa un `access_url` aqui.** Ese enlace caduca —900 s por defecto— y
 * publicarlo en una etiqueta que un *crawler* leera dias despues produciria una
 * vista previa rota. Es la regla ya vigente de D-08.
 *
 * `og:image` **personalizado por contenido** —la portada del articulo
 * compartido— queda **bloqueado** hasta que `Task/030` resuelva D-08
 * (bloqueo B-016-1). Por eso este modulo no expone ninguna forma de inyectar
 * otra imagen: la puerta no existe, en lugar de existir y confiar en que nadie
 * la use.
 */
export const RUTA_DE_LA_IMAGEN_OG = '/og-imagen.png';

/** Dimensiones reales del activo, declaradas para que el *crawler* no adivine. */
export const ANCHO_DE_LA_IMAGEN_OG = 1200;
export const ALTO_DE_LA_IMAGEN_OG = 630;

/** Texto alternativo de la imagen Open Graph (requisito A-04 en el marcado). */
export const ALT_DE_LA_IMAGEN_OG = `Marca de ${NOMBRE_DEL_SITIO}`;

/**
 * Devuelve el texto si aporta algo, o `null`.
 *
 * Existe para que la cadena de respaldo se escriba con `??` y no con `||`: son
 * distintos, y aqui la diferencia importa. `seo_description` puede llegar como
 * cadena **vacia** —el contrato la admite—, y `??` la aceptaria como valor bueno,
 * emitiendo una `description` vacia. Normalizar a `null` primero deja que `??`
 * signifique exactamente *«si no hay texto util, usa el siguiente»*.
 */
export function textoNoVacio(valor: string | null | undefined): string | null {
  const recortado = valor?.trim() ?? '';
  return recortado === '' ? null : recortado;
}

/**
 * Compone una URL absoluta del sitio a partir de una ruta.
 *
 * Descarta la cadena de consulta y el fragmento **a proposito**: una URL
 * canonica identifica un documento, y `?q=` o `#ancla` identifican una consulta
 * o una posicion dentro de el. Declarar canonica `/buscar?q=docker` invitaria a
 * indexar tantas URL como terminos existan.
 *
 * Se usa `URL` y no concatenacion para que un slug con caracteres no seguros
 * quede codificado por la plataforma en lugar de por una expresion regular
 * escrita a mano.
 */
export function urlAbsoluta(origen: string, ruta: string): string {
  const base = origen.replace(/\/+$/, '');
  const [sinFragmento = ''] = ruta.split('#');
  const [soloRuta = ''] = sinFragmento.split('?');

  // La ruta se pasa **relativa** —sin barra inicial— y la base **con** barra
  // final. Con una barra inicial, `URL` la trataria como ruta absoluta del
  // anfitrion y descartaria el prefijo del origen: un sitio servido en
  // `https://ejemplo.test/blog` perderia el `/blog`.
  return new URL(soloRuta.replace(/^\/+/, ''), `${base}/`).toString();
}
