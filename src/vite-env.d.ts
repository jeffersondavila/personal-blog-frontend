/// <reference types="vite/client" />

/**
 * Contrato tipado de las variables de entorno del frontend.
 *
 * Declararlas aqui hace que `import.meta.env.VITE_API_BASE_URL` tenga tipo en
 * lugar de ser `any`, y que una variable inventada sea un error de compilacion
 * en vez de un `undefined` silencioso en tiempo de ejecucion.
 *
 * El tipo dice **que forma tiene** el valor; no garantiza que exista. Esa
 * comprobacion es de ejecucion y la hace `readAppConfig` en
 * `src/lib/config/env.ts` (requisito T-01).
 */
interface ImportMetaEnv {
  /** Origen del API del backend, sin `/api/v1` y sin barra final. */
  readonly VITE_API_BASE_URL?: string;

  /**
   * Origen publico del **sitio**, sin barra final.
   *
   * Distinto del anterior: con **D-15** el sitio vive en el dominio raiz y el
   * API en un subdominio. Lo consumen `canonical` (**E-04**), `og:url`
   * (**E-03**) y las URL absolutas del marcado (`Task/016`).
   */
  readonly VITE_SITE_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
