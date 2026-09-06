/**
 * Contenido de `robots.txt` (`Task/016`, requisito E-06).
 *
 * Por que se genera en el build y no vive en `public/`
 * ---------------------------------------------------
 *
 * La linea `Sitemap:` necesita una **URL absoluta**, y el origen es
 * configuracion: en local es Traefik y en produccion lo fijaran `Task/034` y
 * `Task/035` cuando **D-07** se resuelva. Un archivo estatico de `public/` se
 * copia tal cual y no puede llevar un valor que depende del entorno.
 *
 * Por que la URL del sitemap se compone con el origen del **API**
 * --------------------------------------------------------------
 *
 * El sitemap lo **sirve el backend** (`GET /sitemap.xml`, decision D-016-B), asi
 * que su URL cuelga del origen del API, no del sitio. Un `robots.txt` puede
 * declarar un sitemap alojado en **otro anfitrion controlado**: el protocolo no
 * exige que compartan *host*, y por eso esto no crea ninguna dependencia de
 * `Task/034`.
 *
 * No se anade una tercera variable de entorno: `VITE_API_BASE_URL` ya representa
 * el origen del API y basta.
 *
 * Lo que `robots.txt` NO hace
 * ---------------------------
 *
 * **No protege nada.** `Disallow` es una peticion a agentes que colaboran, y
 * controla el **rastreo**, no la **indexacion**: una URL enlazada desde fuera
 * puede acabar indexada sin haber sido rastreada. El control de acceso al panel
 * es la sesion de `Task/011` y las guardas de `Task/015`, y lo sigue siendo.
 *
 * La garantia sin JavaScript para `/admin/*` exigiria la cabecera
 * `X-Robots-Tag`, que es de `Task/018` (requisito **S-05**). Por eso **E-06
 * queda PARCIAL** en esta tarea.
 */

/** Rutas que se piden no rastrear. */
const NO_RASTREAR: readonly string[] = ['/admin/'];

/** Ruta del sitemap dentro del origen del API (fuera del prefijo versionado). */
const RUTA_DEL_SITEMAP = '/sitemap.xml';

export interface OpcionesDeRobots {
  /** Origen del API, del que cuelga el sitemap. Sin el, la linea se omite. */
  readonly apiBaseUrl?: string | undefined;
}

/** Devuelve la URL absoluta del sitemap, o `null` si el origen no sirve. */
function urlDelSitemap(apiBaseUrl: string | undefined): string | null {
  const recortado = apiBaseUrl?.trim() ?? '';
  if (recortado === '') {
    return null;
  }
  try {
    const origen = new URL(recortado);
    if (origen.protocol !== 'http:' && origen.protocol !== 'https:') {
      return null;
    }
  } catch {
    // Fail-closed documental: mejor no declarar sitemap que declarar uno falso.
    // Un `Sitemap:` roto es un error que el buscador reporta al propietario.
    return null;
  }
  return `${recortado.replace(/\/+$/, '')}${RUTA_DEL_SITEMAP}`;
}

/** Construye el contenido de `robots.txt`. */
export function construirRobotsTxt({ apiBaseUrl }: OpcionesDeRobots): string {
  const sitemap = urlDelSitemap(apiBaseUrl);

  const lineas = [
    '# robots.txt de personal-blog-frontend, generado en el build (Task/016, E-06).',
    '#',
    '# `Disallow` controla el RASTREO, no la indexacion, y no es un control de',
    '# acceso: el panel esta protegido por la sesion administrativa de Task/011.',
    '',
    'User-agent: *',
    ...NO_RASTREAR.map((ruta) => `Disallow: ${ruta}`),
  ];

  if (sitemap !== null) {
    lineas.push('', `Sitemap: ${sitemap}`);
  }

  return `${lineas.join('\n')}\n`;
}
