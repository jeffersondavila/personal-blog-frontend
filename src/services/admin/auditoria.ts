/**
 * Historial de acciones administrativas (`api-contracts.md` seccion 15).
 *
 *     GET /api/v1/admin/audit-events?page&page_size
 *
 * Es la tercera pieza del dashboard minimo (`MVP_SCOPE.md` seccion 3.3), y la
 * entrego `Task/012.1`. **Solo lectura**: no hay `POST`, `PUT`, `PATCH` ni
 * `DELETE`, y consultarla no genera un evento nuevo.
 *
 * **Sin filtros.** El contrato admite `page` y `page_size` y nada mas: seccion
 * 3.3 pide *"los ultimos"*, y un filtro anadido hoy seria superficie `v1`
 * permanente.
 *
 * Llega ya ordenado `occurred_at` descendente con desempate `id` ascendente
 * (seccion 15.4), asi que el panel **no reordena**: hacerlo aqui probaria la
 * prueba en lugar de la consulta.
 */
import type { HttpClient } from '../http';
import { listarAdmin } from './cliente';
import type { EventoDeAuditoria, Pagina } from './types';

export function listarEventosDeAuditoria(
  cliente: HttpClient,
  parametros: { readonly page?: number; readonly pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<Pagina<EventoDeAuditoria>> {
  return listarAdmin<EventoDeAuditoria>(cliente, '/audit-events', parametros, signal);
}
