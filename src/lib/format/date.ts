/**
 * Formato de fechas del sitio publico.
 *
 * El contrato entrega fechas ISO 8601 **en UTC** (`api-contracts.md`, seccion
 * 1). Se formatean tambien en UTC: una fecha de publicacion es un dato
 * editorial, y que cambie de dia segun la zona horaria del visitante seria un
 * defecto, no una cortesia.
 */

const FORMATO_LARGO = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' });

/** «15 de agosto de 2026», o `null` si la entrada no es una fecha valida. */
export function formatearFechaLarga(iso: string | null | undefined): string | null {
  if (iso === null || iso === undefined || iso.trim() === '') {
    return null;
  }
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return null;
  }
  return FORMATO_LARGO.format(fecha);
}
