/**
 * Duracion de un video en un texto breve (`duration_seconds`, CONTENT_MODEL
 * seccion 3.4). Los segundos solo se muestran por debajo del minuto: en un
 * listado importa el orden de magnitud, no la precision.
 */
export function formatearDuracion(segundos: number | null | undefined): string | null {
  if (segundos === null || segundos === undefined || !Number.isFinite(segundos) || segundos <= 0) {
    return null;
  }
  const total = Math.round(segundos);
  if (total < 60) {
    return `${String(total)} s`;
  }
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  if (horas === 0) {
    return `${String(minutos)} min`;
  }
  return minutos === 0 ? `${String(horas)} h` : `${String(horas)} h ${String(minutos)} min`;
}
