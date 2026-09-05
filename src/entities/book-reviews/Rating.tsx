/**
 * Valoracion de una review, entero de 1 a 5 (CONTENT_MODEL seccion 3.3).
 *
 * El **texto** «N de 5» es el portador del significado (A-07); las estrellas
 * son refuerzo visual y van `aria-hidden` para no leerse dos veces. Un valor
 * fuera de la escala se acota en lugar de romper el render: el contrato lo
 * valida, pero la interfaz no debe caerse si algun dia cambia.
 */
import styles from './Rating.module.css';

export const ESCALA_MAXIMA = 5;

export interface RatingProps {
  readonly rating: number | null | undefined;
}

export function Rating({ rating }: RatingProps) {
  if (rating === null || rating === undefined || !Number.isFinite(rating)) {
    return null;
  }
  const valor = Math.min(ESCALA_MAXIMA, Math.max(0, Math.round(rating)));

  return (
    <p className={styles['valoracion']}>
      Valoración:{' '}
      <span aria-hidden="true" className={styles['estrellas']}>
        {'★'.repeat(valor)}
        {'☆'.repeat(ESCALA_MAXIMA - valor)}
      </span>{' '}
      {valor} de {ESCALA_MAXIMA}
    </p>
  );
}
