/**
 * Formulario de un contenido publicable: lo que los cuatro tipos comparten.
 *
 * Concentra estructura, no dominio. Los campos propios de cada tipo llegan como
 * `extras`, asi que la review sigue teniendo su valoracion y el video su
 * proveedor **sin** que este componente los conozca. La alternativa —un
 * formulario generico dirigido por metadatos— habria escondido diferencias de
 * dominio reales, que es justo lo que el alcance prohibe.
 *
 * Reglas del contrato que el formulario aplica y no puede relajar:
 *
 * - **`PUT` es representacion completa** (decision **D-012-C**): se envia el
 *   objeto entero, y omitir un campo opcional lo deja nulo.
 * - **`status` y `published_at` no se envian nunca**: no son escribibles
 *   (decision **D-012-A**), y el backend responde `422` si aparecen porque sus
 *   esquemas usan `extra="forbid"`.
 * - **El slug deja de ser editable tras la primera publicacion**: `published_at`
 *   no nulo significa que ya tuvo URL publica (decision **D-012-F**). El `409
 *   slug_is_immutable` sigue tratandose como respaldo.
 * - **El slug es opcional al crear**: si falta, se deriva del titulo (B.2).
 *
 * **A-03** y **A-08** viven en `FormField` y `FormFeedback`; aqui solo se usan.
 */
import type { ReactNode } from 'react';

import styles from './ContenidoForm.module.css';
import type { ValoresComunes } from './valoresComunes';
import { Button, FormFeedback, FormField, Stack } from '../../components';

export interface ContenidoFormProps {
  readonly titulo: string;
  readonly valores: ValoresComunes;
  readonly onChange: (valores: ValoresComunes) => void;
  /** `true` cuando `published_at` no es nulo: el slug queda congelado. */
  readonly slugBloqueado: boolean;
  readonly enviando: boolean;
  readonly onSubmit: () => void;
  /** Campos propios del tipo, insertados tras los comunes. */
  readonly extras?: ReactNode;
  /** Acciones de ciclo de vida, cuando el contenido ya existe. */
  readonly acciones?: ReactNode;
  readonly errorGeneral?: string | undefined;
  readonly camposDelError?: readonly string[];
  readonly exito?: string | undefined;
  readonly erroresPorCampo?: Readonly<Record<string, string>>;
}

export function ContenidoForm({
  titulo,
  valores,
  onChange,
  slugBloqueado,
  enviando,
  onSubmit,
  extras,
  acciones,
  errorGeneral,
  camposDelError,
  exito,
  erroresPorCampo = {},
}: ContenidoFormProps) {
  function actualizar<K extends keyof ValoresComunes>(campo: K, valor: ValoresComunes[K]) {
    onChange({ ...valores, [campo]: valor });
  }

  return (
    <Stack gap="lg">
      <h1>{titulo}</h1>

      {errorGeneral !== undefined ? (
        <FormFeedback tono="error" {...(camposDelError ? { campos: camposDelError } : {})}>
          {errorGeneral}
        </FormFeedback>
      ) : null}

      {exito !== undefined ? <FormFeedback tono="exito">{exito}</FormFeedback> : null}

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          if (!enviando) {
            onSubmit();
          }
        }}
        noValidate
      >
        <Stack gap="md">
          <FormField
            label="Título"
            required
            {...(erroresPorCampo['title'] !== undefined ? { error: erroresPorCampo['title'] } : {})}
          >
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                maxLength={200}
                value={valores.title}
                onChange={(evento) => {
                  actualizar('title', evento.target.value);
                }}
              />
            )}
          </FormField>

          <FormField
            label="Slug"
            descripcion={
              slugBloqueado
                ? 'Este contenido ya se publicó alguna vez, así que su slug no puede cambiarse.'
                : 'Opcional: si lo dejas vacío se deriva del título.'
            }
            {...(erroresPorCampo['slug'] !== undefined ? { error: erroresPorCampo['slug'] } : {})}
          >
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                maxLength={160}
                disabled={slugBloqueado}
                value={valores.slug}
                onChange={(evento) => {
                  actualizar('slug', evento.target.value);
                }}
              />
            )}
          </FormField>

          <FormField
            label="Resumen"
            descripcion="Hace falta al publicar, salvo que rellenes la descripción SEO."
            {...(erroresPorCampo['summary'] !== undefined
              ? { error: erroresPorCampo['summary'] }
              : {})}
          >
            {(atributos) => (
              <textarea
                {...atributos}
                rows={3}
                value={valores.summary}
                onChange={(evento) => {
                  actualizar('summary', evento.target.value);
                }}
              />
            )}
          </FormField>

          {extras}

          <div className={styles['casilla']}>
            <label>
              <input
                type="checkbox"
                checked={valores.featured}
                onChange={(evento) => {
                  actualizar('featured', evento.target.checked);
                }}
              />{' '}
              Destacado en la portada
            </label>
          </div>

          <FormField label="Título SEO">
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                maxLength={70}
                value={valores.seo_title}
                onChange={(evento) => {
                  actualizar('seo_title', evento.target.value);
                }}
              />
            )}
          </FormField>

          <FormField label="Descripción SEO">
            {(atributos) => (
              <textarea
                {...atributos}
                rows={2}
                maxLength={160}
                value={valores.seo_description}
                onChange={(evento) => {
                  actualizar('seo_description', evento.target.value);
                }}
              />
            )}
          </FormField>

          <Stack direction="horizontal" gap="sm" wrap>
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </Button>
          </Stack>
        </Stack>
      </form>

      {acciones}
    </Stack>
  );
}
