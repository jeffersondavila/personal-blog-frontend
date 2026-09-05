/**
 * Estado de carga (`Task/014`).
 *
 * `role="status"` es una region viva de cortesia: el lector de pantalla anuncia
 * el texto cuando termina lo que este diciendo, **sin mover el foco** ni
 * interrumpir. Es texto visible, no un indicador solo grafico: quien no ve la
 * animacion —no hay animacion— lee lo mismo que todos.
 */
import type { ReactNode } from 'react';

import styles from './LoadingState.module.css';

export interface LoadingStateProps {
  readonly children?: ReactNode;
}

export function LoadingState({ children = 'Cargando…' }: LoadingStateProps) {
  return (
    <p role="status" className={styles['estado']}>
      {children}
    </p>
  );
}
