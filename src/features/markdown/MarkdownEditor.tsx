/**
 * Editor Markdown del panel y su vista previa (decision **D-015-E**, que
 * resuelve **D-04**).
 *
 *     <textarea> ──valor──▶ useDeferredValue ──▶ MarkdownContent ──▶ vista previa
 *
 * **`<textarea>` nativo y cero dependencias nuevas.** No se instala otro parser,
 * no se duplica la sanitizacion, no se crea un segundo renderizador y no se
 * permite HTML crudo. La vista previa reutiliza **exactamente** el
 * `MarkdownContent` de `Task/014`, asi que usa el mismo `react-markdown`, el
 * mismo `rehype-sanitize`, el mismo `skipHtml` y el mismo esquema: la
 * compatibilidad con la sanitizacion no se promete, es **la misma pieza**
 * (requisito **S-03**, ADR-005).
 *
 * Un editor enriquecido habria pesado cientos de KiB, habria exigido
 * `contenteditable` con su propio ARIA y habria puesto en riesgo **A-03**, que
 * es criterio de esta tarea. Un `textarea` es un control nativo, etiquetable y
 * navegable con teclado.
 *
 * `useDeferredValue` —de React, sin dependencia— evita reprocesar el Markdown en
 * cada pulsacion sin introducir un temporizador propio.
 *
 * **No hay insercion de imagenes en el cuerpo.** No es una carencia del editor:
 * `access_url` es un enlace temporal que `api-contracts.md` seccion 12 prohibe
 * almacenar, asi que escribir `![alt](access_url)` en el Markdown persistiria un
 * enlace que caduca. La URL estable es **D-08** (`Task/030`). La imagen de un
 * contenido se asocia por `cover_id`, `thumbnail_id` o `photo_id`, que si son
 * estables.
 *
 * La conmutacion son dos botones con `aria-pressed`, no un patron ARIA de
 * pestanas: seria un widget compuesto sin necesidad demostrada.
 */
import { useDeferredValue, useId, useState } from 'react';

import { MarkdownContent } from './MarkdownContent';
import styles from './MarkdownEditor.module.css';
import { Button, FormField, Stack } from '../../components';

export interface MarkdownEditorProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (valor: string) => void;
  readonly descripcion?: string;
  readonly error?: string | undefined;
}

type Vista = 'editar' | 'previsualizar';

export function MarkdownEditor({
  label,
  value,
  onChange,
  descripcion,
  error,
}: MarkdownEditorProps) {
  const [vista, setVista] = useState<Vista>('editar');
  const diferido = useDeferredValue(value);
  const idPrevia = useId();

  return (
    <Stack gap="sm">
      <Stack direction="horizontal" gap="xs" wrap>
        <Button
          variant={vista === 'editar' ? 'primary' : 'secondary'}
          aria-pressed={vista === 'editar'}
          onClick={() => {
            setVista('editar');
          }}
        >
          Editar
        </Button>
        <Button
          variant={vista === 'previsualizar' ? 'primary' : 'secondary'}
          aria-pressed={vista === 'previsualizar'}
          onClick={() => {
            setVista('previsualizar');
          }}
        >
          Vista previa
        </Button>
      </Stack>

      {vista === 'editar' ? (
        <FormField
          label={label}
          {...(descripcion !== undefined ? { descripcion } : {})}
          {...(error !== undefined ? { error } : {})}
        >
          {(atributos) => (
            <textarea
              {...atributos}
              rows={16}
              value={value}
              onChange={(evento) => {
                onChange(evento.target.value);
              }}
            />
          )}
        </FormField>
      ) : (
        <section aria-labelledby={idPrevia} className={styles['previa']}>
          <h3 id={idPrevia}>Vista previa</h3>
          {/*
            La vista previa **no publica ni expone** nada: no cambia el estado
            del contenido, no genera URL publica y vive dentro de una ruta
            protegida (USER_FLOWS.md B.6).
          */}
          <MarkdownContent markdown={diferido} />
        </section>
      )}
    </Stack>
  );
}
