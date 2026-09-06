/**
 * Resultado de una operacion, anunciado de forma accesible.
 *
 * Es la otra mitad de **A-08** —*errores de formulario anunciados de forma
 * accesible*—: `FormField` asocia el error **a su campo**, y esto anuncia el
 * error **del formulario entero** y el resumen de lo que falta.
 *
 * Dos roles, y la diferencia no es cosmetica:
 *
 * - `role="alert"` para los errores. Interrumpe: algo salio mal y hay que
 *   enterarse ahora.
 * - `role="status"` para el exito. No interrumpe: es informacion, no un
 *   problema.
 *
 * El foco se gestiona aqui y en un solo sitio. Tras un envio fallido, el
 * elemento recibe el foco —lleva `tabIndex={-1}` para poder recibirlo sin
 * entrar en el orden de tabulacion—, de modo que quien navega con teclado o con
 * lector de pantalla aterriza en la explicacion en lugar de tener que buscarla.
 *
 * Se eleva a `components` porque lo consumen los nueve formularios del panel y
 * ademas las acciones de medios, etiquetas y publicacion.
 */
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import styles from './FormFeedback.module.css';

export type TonoDeFeedback = 'error' | 'exito';

export interface FormFeedbackProps {
  readonly tono: TonoDeFeedback;
  readonly children: ReactNode;
  /**
   * Lista de campos afectados, si el backend los nombro.
   *
   * Es el caso de `409 cannot_publish_incomplete_draft`, que devuelve **todos**
   * los campos que faltan a la vez en `details.campos` — no de uno en uno.
   */
  readonly campos?: readonly string[];
  /**
   * Mueve el foco al mensaje al aparecer. Por defecto solo lo hace el error.
   */
  readonly enfocar?: boolean;
}

export function FormFeedback({ tono, children, campos, enfocar }: FormFeedbackProps) {
  const referencia = useRef<HTMLDivElement>(null);
  const debeEnfocar = enfocar ?? tono === 'error';

  useEffect(() => {
    if (debeEnfocar) {
      referencia.current?.focus();
    }
  }, [debeEnfocar]);

  return (
    <div
      ref={referencia}
      role={tono === 'error' ? 'alert' : 'status'}
      tabIndex={-1}
      className={[styles['feedback'], styles[tono]].filter(Boolean).join(' ')}
    >
      <p className={styles['mensaje']}>{children}</p>
      {campos !== undefined && campos.length > 0 ? (
        <ul className={styles['campos']}>
          {campos.map((campo) => (
            <li key={campo}>{campo}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
