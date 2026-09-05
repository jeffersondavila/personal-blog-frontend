/**
 * Estado de error con reintento (`Task/014`).
 *
 * USER_FLOWS A.1: *«si falla la carga, se muestra un estado de error con
 * reintento; el sitio no queda en blanco»*. `role="alert"` lo anuncia de
 * inmediato; el boton es el `Button` nativo del sistema, asi que se alcanza y
 * se activa con teclado sin nada mas.
 *
 * El mensaje es **generico** a proposito. El fallo real —red, `5xx`, cuerpo
 * ilegible— puede arrastrar informacion interna y esta superficie es publica;
 * el diagnostico se hace con los logs (requisito S-07).
 */
import styles from './ErrorState.module.css';
import { Button } from '../Button/Button';
import { Stack } from '../Stack/Stack';

export interface ErrorStateProps {
  readonly mensaje?: string;
  readonly onRetry: () => void;
}

export function ErrorState({
  mensaje = 'No se pudo cargar el contenido. Comprueba tu conexión e inténtalo de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className={styles['error']}>
      <Stack gap="sm" align="start">
        <p className={styles['mensaje']}>{mensaje}</p>
        <Button variant="primary" onClick={onRetry}>
          Reintentar
        </Button>
      </Stack>
    </div>
  );
}
