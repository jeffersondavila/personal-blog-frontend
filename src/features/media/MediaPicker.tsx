/**
 * Seleccion de una imagen de la biblioteca para un campo de imagen.
 *
 * **Render frente a escritura**, que es la distincion que hay que tener clara:
 *
 * - Para **mostrar** la imagen se usa `access_url` a traves de `MediaImage`. Es
 *   un enlace **temporal**: no se almacena ni se persiste.
 * - Para **asociarla** se envia su `id` en `cover_id`, `thumbnail_id` o
 *   `photo_id`. La regla publica *"solo `access_url`"* es de lectura.
 *
 * **Politica de `alt_text`** (`api-contracts.md` seccion 14.11, decisiones
 * **D-010-N**, **D-012-Y** y **D-012-Z**), aplicada tal cual y sin redefinirla:
 *
 * | Estado de la imagen | Qué hace el panel |
 * | --- | --- |
 * | Sin texto | Campo **editable**; se envia junto al `id`. Es el primer uso y lo fija |
 * | Con texto | Se muestra **como dato de la imagen**, no editable, y **se omite** del cuerpo |
 * | Sin imagen | El campo no existe: enviar texto sin imagen es `422` |
 *
 * Omitir el campo cuando la imagen ya tiene texto es lo que hace que
 * `409 alt_text_conflict` **no sea alcanzable** desde esta interfaz: no se envia
 * un valor que pudiera diferir. Corregir un texto ya compartido sigue siendo
 * mejora futura sin propietario (**D-012-Z**, aceptada para el MVP).
 */
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../app/httpClientContext';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Stack,
} from '../../components';
import { MediaImage } from '../../entities/media/MediaImage';
import { useCargaAdmin } from '../admin/useCargaAdmin';
import { listarMedios } from '../../services/admin';
import type { MedioAdministrativo } from '../../services/admin';
import styles from './MediaPicker.module.css';

export interface MediaPickerProps {
  readonly label: string;
  /** Imagen asociada ahora mismo, si la hay. */
  readonly seleccionada: MedioAdministrativo | null;
  readonly onSeleccionar: (medio: MedioAdministrativo | null) => void;
  /** Texto alternativo que el formulario enviara, si procede. */
  readonly altText: string;
  readonly onAltTextChange: (valor: string) => void;
  readonly error?: string | undefined;
}

export function MediaPicker({
  label,
  seleccionada,
  onSeleccionar,
  altText,
  onAltTextChange,
  error,
}: MediaPickerProps) {
  const cliente = useHttpClient();
  const [abierta, setAbierta] = useState(false);

  const cargar = useCallback(
    (signal: AbortSignal) => listarMedios(cliente, { pageSize: 24 }, signal),
    [cliente],
  );
  const biblioteca = useCargaAdmin(cargar);

  /*
   * El texto solo se puede escribir cuando la imagen **no lo tiene**. Si ya lo
   * tiene, se muestra y no se envia: el texto es del asset, no de este
   * contenido.
   */
  const yaTieneTexto = seleccionada !== null && (seleccionada.alt_text ?? '') !== '';

  return (
    <Stack gap="sm">
      <p className={styles['titulo']}>{label}</p>

      {seleccionada !== null ? (
        <Stack gap="xs">
          <MediaImage medio={seleccionada} className={styles['miniatura']} />
          <p className={styles['nombre']}>{seleccionada.original_filename}</p>
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                onSeleccionar(null);
                onAltTextChange('');
              }}
            >
              Quitar imagen
            </Button>
          </div>
        </Stack>
      ) : (
        <p>Sin imagen asociada.</p>
      )}

      {seleccionada !== null ? (
        yaTieneTexto ? (
          <p className={styles['nota']}>
            Texto alternativo de la imagen: «{seleccionada.alt_text}». Es un dato de la imagen y se
            reutiliza tal cual; no se sobrescribe desde aquí.
          </p>
        ) : (
          <FormField
            label="Texto alternativo"
            descripcion="Describe la imagen. Hace falta para poder publicar (requisito A-04)."
            {...(error !== undefined ? { error } : {})}
          >
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                maxLength={255}
                value={altText}
                onChange={(evento) => {
                  onAltTextChange(evento.target.value);
                }}
              />
            )}
          </FormField>
        )
      ) : null}

      <div>
        <Button
          variant="secondary"
          aria-expanded={abierta}
          onClick={() => {
            setAbierta((valor) => !valor);
          }}
        >
          {abierta ? 'Cerrar biblioteca' : 'Elegir de la biblioteca'}
        </Button>
      </div>

      {abierta ? (
        <Card>
          {biblioteca.estado.fase === 'cargando' ? <LoadingState /> : null}
          {biblioteca.estado.fase === 'error' || biblioteca.estado.fase === 'no-encontrado' ? (
            <ErrorState onRetry={biblioteca.reintentar} />
          ) : null}
          {biblioteca.estado.fase === 'exito' ? (
            biblioteca.estado.datos.items.length === 0 ? (
              <EmptyState mensaje="La biblioteca está vacía. Sube una imagen en la sección de medios." />
            ) : (
              <ul className={styles['galeria']}>
                {biblioteca.estado.datos.items.map((medio) => (
                  <li key={medio.id}>
                    <button
                      type="button"
                      className={styles['opcion']}
                      onClick={() => {
                        onSeleccionar(medio);
                        onAltTextChange('');
                        setAbierta(false);
                      }}
                    >
                      <MediaImage medio={medio} className={styles['miniatura']} />
                      <span>{medio.original_filename}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </Card>
      ) : null}
    </Stack>
  );
}
