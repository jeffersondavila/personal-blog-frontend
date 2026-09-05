/**
 * Fecha de publicacion como `<time>`: legible por maquina en `dateTime` y por
 * personas en el texto (A-02).
 */
import { formatearFechaLarga } from '../../lib/format/date';

export interface PublishedDateProps {
  readonly fecha: string | null | undefined;
  readonly className?: string | undefined;
}

export function PublishedDate({ fecha, className }: PublishedDateProps) {
  const texto = formatearFechaLarga(fecha);
  if (texto === null || fecha === null || fecha === undefined) {
    return null;
  }

  return (
    <time dateTime={fecha} {...(className !== undefined ? { className } : {})}>
      {texto}
    </time>
  );
}
