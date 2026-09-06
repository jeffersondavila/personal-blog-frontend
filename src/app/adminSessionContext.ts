/**
 * Estado de la sesion administrativa, expuesto por contexto.
 *
 * El valor por defecto es `null` —no una sesion inventada— para que usar el
 * contexto fuera del proveedor sea un error inmediato y no una pantalla que
 * finge estar autenticada. Es la misma postura de `appConfigContext` y
 * `httpClientContext`.
 *
 * El modulo se separa del componente a proposito: uno que exporte componentes y
 * ademas valores no componentes rompe la recarga en caliente
 * (`eslint-plugin-react-refresh`).
 */
import { createContext, use } from 'react';

import type { AdministradorAutenticado } from '../services/admin';

/**
 * Las tres fases de la sesion.
 *
 * `desconocida` es la fase inicial y **no es lo mismo que anonima**: mientras
 * `/me` no responde no se sabe nada, y confundirlas haria que el panel echara
 * al administrador en cada recarga antes de preguntar.
 */
export type EstadoDeSesion =
  | { readonly fase: 'desconocida' }
  | { readonly fase: 'autenticada'; readonly administrador: AdministradorAutenticado }
  | { readonly fase: 'anonima' };

export interface SesionAdministrativa {
  readonly estado: EstadoDeSesion;
  /** Abre sesion con las credenciales dadas. Propaga el error del contrato. */
  readonly entrar: (email: string, password: string) => Promise<void>;
  /** Cierra sesion. El resultado observable es `anonima` pase lo que pase. */
  readonly salir: () => Promise<void>;
  /**
   * Marca la sesion como terminada sin llamar al servidor.
   *
   * Lo usa el manejador de `401`: el servidor ya ha dicho que la credencial no
   * vale, y volver a preguntarle seria un viaje para oir lo mismo.
   */
  readonly terminar: () => void;
}

export const AdminSessionContext = createContext<SesionAdministrativa | null>(null);

/** Devuelve la sesion administrativa activa. */
export function useAdminSession(): SesionAdministrativa {
  const sesion = use(AdminSessionContext);

  if (sesion === null) {
    throw new Error('useAdminSession se uso fuera de AdminSessionContext.');
  }

  return sesion;
}
