/**
 * Configuracion del frontend a partir de variables de entorno.
 *
 * Requisito T-01 de
 * `personal-blog-infra/docs/architecture/non-functional-requirements.md`:
 * *configuracion mediante variables de entorno, **validada al arrancar***. El
 * equivalente en el backend es `app.shared.configuration`.
 *
 * Por que se valida en el arranque y no en el primer uso: una URL de API
 * ausente o mal escrita se manifiesta si no como una peticion fallida en un
 * punto arbitrario de la navegacion, meses despues y lejos de la causa. Aqui
 * la aplicacion se niega a montar y dice exactamente que variable falta.
 *
 * `readAppConfig` es **pura**: recibe la fuente de variables en lugar de leer
 * `import.meta.env` por su cuenta. Eso es lo que permite probarla sin depender
 * del `.env` de quien ejecute la suite.
 */

/** Configuracion efectiva de la aplicacion. */
export interface AppConfig {
  /**
   * Origen del API del backend, ya normalizado: sin barra final.
   *
   * Es el **origen**, no la base del contrato de datos. `/api/v1` versiona los
   * recursos, pero `/health` vive deliberadamente fuera de ese prefijo
   * (`api-contracts.md`, seccion 2); una unica base que sirva para los dos
   * tiene que situarse por encima de ambos.
   */
  readonly apiBaseUrl: string;

  /**
   * Origen publico del **sitio**, ya normalizado: sin barra final.
   *
   * No es el del API. Con **D-15** el sitio vive en el dominio raiz y el API en
   * un subdominio, asi que son dos valores distintos y confundirlos produciria
   * `canonical` y `og:url` apuntando al API.
   *
   * Lo exigen `canonical` (**E-04**), `og:url` (**E-03**) y el sitemap
   * (**E-05**): las tres necesitan URL **absolutas**, y una SPA no puede
   * deducir su propio origen canonico de `location` —un mismo `dist/` se sirve
   * detras de Traefik en local y en otro origen en produccion, y `location`
   * diria el de cada momento, no el canonico—.
   *
   * **No fija ningun dominio**: el dominio concreto es **D-07**, que sigue
   * abierta hasta `Task/035`. Aqui solo se nombra la variable.
   */
  readonly siteBaseUrl: string;
}

/**
 * Fuente de variables de entorno.
 *
 * En ejecucion es `import.meta.env`; en pruebas, un objeto fabricado.
 */
export interface EnvSource {
  readonly VITE_API_BASE_URL?: string | undefined;
  readonly VITE_SITE_BASE_URL?: string | undefined;
}

/** Esquemas admitidos para cualquier origen configurado. */
const ESQUEMAS_ADMITIDOS = new Set(['http:', 'https:']);

/**
 * Error de configuracion del frontend.
 *
 * El mensaje nombra la variable y explica que se esperaba, pero **no repite el
 * valor recibido**: en una aplicacion de navegador ese mensaje puede acabar en
 * la consola o en un informe de errores, y un valor mal configurado puede
 * contener una URL interna que no conviene difundir.
 */
export class ConfigurationError extends Error {
  override readonly name = 'ConfigurationError';
}

/**
 * Lee y valida la configuracion del frontend.
 *
 * @throws {ConfigurationError} Si alguna variable falta o no es utilizable.
 */
export function readAppConfig(source: EnvSource): AppConfig {
  return {
    apiBaseUrl: leerOrigen(source.VITE_API_BASE_URL, {
      variable: 'VITE_API_BASE_URL',
      queEs: 'el origen del API del backend',
      ejemplo: 'http://localhost:8000',
    }),
    siteBaseUrl: leerOrigen(source.VITE_SITE_BASE_URL, {
      variable: 'VITE_SITE_BASE_URL',
      queEs: 'el origen publico del sitio',
      ejemplo: 'http://localhost:8081',
    }),
  };
}

/** Descripcion de la variable que se esta leyendo, para los mensajes de error. */
interface OrigenEsperado {
  readonly variable: string;
  readonly queEs: string;
  readonly ejemplo: string;
}

/**
 * Lee un origen absoluto y lo normaliza, o falla.
 *
 * Es una sola funcion parametrizada y no una por variable: la regla —absoluta,
 * `http`/`https`, sin barra final— es identica para las dos, y duplicarla
 * invitaria a que una divergiera de la otra en silencio.
 *
 * *Fail-closed*: ante un valor ausente o no utilizable **lanza**, nunca
 * devuelve un valor por omision. Un origen inventado produciria un `canonical`
 * apuntando a un sitio que no es este, que es peor que no arrancar.
 */
function leerOrigen(valor: string | undefined, esperado: OrigenEsperado): string {
  const recortado = valor?.trim() ?? '';

  if (recortado === '') {
    throw new ConfigurationError(
      `Falta la variable de entorno ${esperado.variable}. Copia .env.example a .env.local ` +
        `y define ${esperado.queEs}.`,
    );
  }

  let url: URL;
  try {
    url = new URL(recortado);
  } catch {
    throw new ConfigurationError(
      `${esperado.variable} debe ser una URL absoluta, por ejemplo ${esperado.ejemplo}.`,
    );
  }

  if (!ESQUEMAS_ADMITIDOS.has(url.protocol)) {
    throw new ConfigurationError(`${esperado.variable} debe usar el esquema http o https.`);
  }

  // Se normaliza sin barra final para que la configuracion tenga una sola
  // forma canonica; quien la consuma se encarga de unir el origen y la ruta.
  return recortado.replace(/\/+$/, '');
}
