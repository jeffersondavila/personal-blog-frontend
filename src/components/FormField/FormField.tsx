/**
 * Campo de formulario con su etiqueta, su descripcion y su error asociados.
 *
 * Es el **unico** punto donde se generan los `id`, el `aria-describedby` y el
 * `aria-invalid` de los que dependen **A-03** —*labels en formularios,
 * asociadas correctamente a sus campos*— y **A-08** —*errores de formulario
 * anunciados de forma accesible*—. Repetir ese cableado campo a campo
 * garantizaria que algun dia faltara en uno.
 *
 * Se eleva a `components` porque tiene **nueve** consumidores reales —los nueve
 * formularios del panel— y decenas de campos. No envuelve el control: lo recibe
 * como funcion y le entrega los atributos que debe llevar. Envolver `<input>`
 * habria creado una capa sin comportamiento propio (ADR-004, requisito **M-06**)
 * y habria obligado a reexponer cada atributo nativo uno por uno.
 *
 * La obligatoriedad se comunica **con texto**, no solo con un asterisco de
 * color: el requisito **A-07** prohibe depender del color para transmitir
 * informacion, y un asterisco rojo es exactamente eso.
 */
import { useId } from 'react';
import type { ReactNode } from 'react';

import styles from './FormField.module.css';

/** Atributos que el campo debe recibir para quedar correctamente asociado. */
export interface AtributosDelControl {
  readonly id: string;
  readonly required?: boolean;
  readonly 'aria-invalid'?: true;
  readonly 'aria-describedby'?: string;
}

export interface FormFieldProps {
  /** Texto de la etiqueta. **Siempre visible**: nunca se usa `placeholder`. */
  readonly label: string;
  /** Control del campo. Recibe los atributos que lo hacen accesible. */
  readonly children: (atributos: AtributosDelControl) => ReactNode;
  readonly required?: boolean;
  /** Ayuda permanente del campo, si la hay. */
  readonly descripcion?: string;
  /** Mensaje de error. Su presencia marca el campo como invalido. */
  readonly error?: string | undefined;
}

export function FormField({
  label,
  children,
  required = false,
  descripcion,
  error,
}: FormFieldProps) {
  const id = useId();
  const idDescripcion = `${id}-descripcion`;
  const idError = `${id}-error`;

  /*
   * El orden importa: el lector de pantalla anuncia la descripcion antes que el
   * error, que es el orden en que una persona los leeria en pantalla.
   */
  const descritoPor = [
    descripcion !== undefined ? idDescripcion : null,
    error !== undefined ? idError : null,
  ]
    .filter((valor): valor is string => valor !== null)
    .join(' ');

  return (
    <div className={styles['campo']}>
      <label htmlFor={id} className={styles['etiqueta']}>
        {label}
        {required ? <span className={styles['obligatorio']}> (obligatorio)</span> : null}
      </label>

      {descripcion !== undefined ? (
        <p id={idDescripcion} className={styles['descripcion']}>
          {descripcion}
        </p>
      ) : null}

      {children({
        id,
        ...(required ? { required: true } : {}),
        ...(error !== undefined ? { 'aria-invalid': true as const } : {}),
        ...(descritoPor !== '' ? { 'aria-describedby': descritoPor } : {}),
      })}

      {error !== undefined ? (
        <p id={idError} className={styles['error']}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
