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
}

/**
 * Fuente de variables de entorno.
 *
 * En ejecucion es `import.meta.env`; en pruebas, un objeto fabricado.
 */
export interface EnvSource {
  readonly VITE_API_BASE_URL?: string | undefined;
}

/** Esquemas admitidos para el origen del API. */
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
  return { apiBaseUrl: leerOrigenDelApi(source.VITE_API_BASE_URL) };
}

function leerOrigenDelApi(valor: string | undefined): string {
  const recortado = valor?.trim() ?? '';

  if (recortado === '') {
    throw new ConfigurationError(
      'Falta la variable de entorno VITE_API_BASE_URL. Copia .env.example a .env.local ' +
        'y define el origen del API del backend.',
    );
  }

  let url: URL;
  try {
    url = new URL(recortado);
  } catch {
    throw new ConfigurationError(
      'VITE_API_BASE_URL debe ser una URL absoluta, por ejemplo http://localhost:8000.',
    );
  }

  if (!ESQUEMAS_ADMITIDOS.has(url.protocol)) {
    throw new ConfigurationError('VITE_API_BASE_URL debe usar el esquema http o https.');
  }

  // Se normaliza sin barra final para que la configuracion tenga una sola
  // forma canonica; el cliente HTTP se encarga de unir el origen y la ruta.
  return recortado.replace(/\/+$/, '');
}
