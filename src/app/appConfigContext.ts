/**
 * Acceso a la configuracion de la aplicacion desde el arbol de componentes.
 *
 * La alternativa —exportar un objeto de configuracion ya construido desde un
 * modulo— haria que cualquier prueba que importe un componente cargue tambien
 * `import.meta.env` y falle o pase segun el `.env` de quien la ejecute.
 * `Task/005.6` y `Task/005.7` cerraron exactamente ese defecto en el backend;
 * el frontend nace sin el.
 *
 * El contexto se separa de `App.tsx` a proposito: un modulo que exporta
 * componentes y ademas valores no componentes rompe la recarga en caliente de
 * React (`eslint-plugin-react-refresh`).
 */
import { createContext, use } from 'react';

import type { AppConfig } from '../lib/config/env';

/**
 * Configuracion activa.
 *
 * El valor por defecto es `null` —no una configuracion inventada— para que
 * usar el contexto sin proveedor sea un error inmediato y no una peticion
 * silenciosa a un origen equivocado.
 */
export const AppConfigContext = createContext<AppConfig | null>(null);

/** Devuelve la configuracion activa. */
export function useAppConfig(): AppConfig {
  const config = use(AppConfigContext);

  if (config === null) {
    throw new Error('useAppConfig se uso fuera de AppConfigContext.');
  }

  return config;
}
