/**
 * Estado vacio (`Task/014`).
 *
 * USER_FLOWS A.2 y A.8 piden un **mensaje explicativo**, no una lista vacia, y
 * en la busqueda ademas sugerencias de navegacion. El mensaje es obligatorio;
 * la salida —enlaces a secciones, «quitar filtro»— la aporta cada pagina como
 * hijos, porque solo ella sabe cual tiene sentido.
 */
import type { ReactNode } from 'react';

import styles from './EmptyState.module.css';
import { Card } from '../Card/Card';
import { Stack } from '../Stack/Stack';

export interface EmptyStateProps {
  readonly mensaje: string;
  readonly children?: ReactNode;
}

export function EmptyState({ mensaje, children }: EmptyStateProps) {
  return (
    <Card className={styles['vacio']}>
      <Stack gap="sm">
        <p className={styles['mensaje']}>{mensaje}</p>
        {children}
      </Stack>
    </Card>
  );
}
