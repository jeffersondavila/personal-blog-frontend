/**
 * Gestion de etiquetas (`USER_FLOWS.md` B.11).
 *
 * Dos reglas del contrato que la interfaz respeta y no reinventa:
 *
 * - **El `slug` es inmutable** (decision **D-012-S**): `PUT` cambia `name` y
 *   `description`, y el cuerpo **no admite `slug`**. Enviarlo seria `422`.
 * - **Borrar una etiqueta en uso no se rechaza**: se desasocia y el contenido
 *   sobrevive. La confirmacion explicita que B.11 pide es un paso de
 *   **interfaz**, y la decision **D-012-T** la asigno a esta tarea.
 *
 * La confirmacion es **en linea**, no un dialogo modal: no existe un componente
 * de dialogo en el sistema y crear uno para esto habria sido una primitiva
 * nueva sin consumidor demostrado. Dos pasos, ambos con botones nativos.
 */
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../app/httpClientContext';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormFeedback,
  FormField,
  LoadingState,
  Stack,
} from '../../components';
import { mensajeDeError } from '../../features/admin/errores';
import { useCargaAdmin, useEscrituraAdmin } from '../../features/admin/useCargaAdmin';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  crearEtiqueta,
  eliminarEtiqueta,
  listarEtiquetas,
  renombrarEtiqueta,
} from '../../services/admin';
import styles from './TagsAdminPage.module.css';

export function TagsAdminPage() {
  useDocumentTitle('Etiquetas');
  const cliente = useHttpClient();
  const escribir = useEscrituraAdmin();

  const cargar = useCallback(
    (signal: AbortSignal) => listarEtiquetas(cliente, { pageSize: 50 }, signal),
    [cliente],
  );
  const recurso = useCargaAdmin(cargar);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  /** Etiqueta cuya eliminacion espera confirmacion. */
  const [porConfirmar, setPorConfirmar] = useState<string | null>(null);
  /** Etiqueta que se esta renombrando, con su valor en curso. */
  const [renombrando, setRenombrando] = useState<{ id: string; nombre: string } | null>(null);

  async function operar(operacion: () => Promise<unknown>, mensaje: string) {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await escribir(operacion);
      setExito(mensaje);
      recurso.reintentar();
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Stack gap="lg">
      <h1>Etiquetas</h1>

      {error !== null ? <FormFeedback tono="error">{error}</FormFeedback> : null}
      {exito !== null ? <FormFeedback tono="exito">{exito}</FormFeedback> : null}

      <Card>
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            if (enviando) {
              return;
            }
            void operar(
              () =>
                crearEtiqueta(cliente, {
                  name: nombre,
                  description: descripcion.trim() === '' ? null : descripcion.trim(),
                }),
              'Etiqueta creada.',
            ).then(() => {
              setNombre('');
              setDescripcion('');
            });
          }}
          noValidate
        >
          <Stack gap="md">
            <h2>Crear etiqueta</h2>
            <FormField
              label="Nombre"
              required
              descripcion="El slug se deriva del nombre y no puede cambiarse después."
            >
              {(atributos) => (
                <input
                  {...atributos}
                  type="text"
                  value={nombre}
                  onChange={(evento) => {
                    setNombre(evento.target.value);
                  }}
                />
              )}
            </FormField>
            <FormField label="Descripción">
              {(atributos) => (
                <input
                  {...atributos}
                  type="text"
                  value={descripcion}
                  onChange={(evento) => {
                    setDescripcion(evento.target.value);
                  }}
                />
              )}
            </FormField>
            <div>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Guardando…' : 'Crear'}
              </Button>
            </div>
          </Stack>
        </form>
      </Card>

      {recurso.estado.fase === 'cargando' ? <LoadingState /> : null}
      {recurso.estado.fase === 'error' || recurso.estado.fase === 'no-encontrado' ? (
        <ErrorState onRetry={recurso.reintentar} />
      ) : null}

      {recurso.estado.fase === 'exito' ? (
        recurso.estado.datos.items.length === 0 ? (
          <EmptyState mensaje="Todavía no hay etiquetas." />
        ) : (
          <ul className={styles['lista']}>
            {recurso.estado.datos.items.map((etiqueta) => (
              <li key={etiqueta.id}>
                <Card>
                  <Stack gap="xs">
                    {renombrando?.id === etiqueta.id ? (
                      <Stack gap="xs">
                        <FormField label={`Nuevo nombre de ${etiqueta.name}`} required>
                          {(atributos) => (
                            <input
                              {...atributos}
                              type="text"
                              value={renombrando.nombre}
                              onChange={(evento) => {
                                setRenombrando({ id: etiqueta.id, nombre: evento.target.value });
                              }}
                            />
                          )}
                        </FormField>
                        <Stack direction="horizontal" gap="sm" wrap>
                          <Button
                            disabled={enviando}
                            onClick={() => {
                              void operar(
                                () =>
                                  renombrarEtiqueta(cliente, etiqueta.id, {
                                    name: renombrando.nombre,
                                    description: etiqueta.description,
                                  }),
                                'Etiqueta renombrada.',
                              ).then(() => {
                                setRenombrando(null);
                              });
                            }}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setRenombrando(null);
                            }}
                          >
                            Cancelar
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <>
                        <strong>{etiqueta.name}</strong>
                        <span className={styles['meta']}>{etiqueta.slug}</span>
                        <Stack direction="horizontal" gap="sm" wrap>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setRenombrando({ id: etiqueta.id, nombre: etiqueta.name });
                            }}
                          >
                            Renombrar
                          </Button>
                          {porConfirmar === etiqueta.id ? (
                            <>
                              <span role="alert">
                                ¿Eliminar «{etiqueta.name}»? El contenido que la use la perderá,
                                pero no se elimina.
                              </span>
                              <Button
                                disabled={enviando}
                                onClick={() => {
                                  void operar(
                                    () => eliminarEtiqueta(cliente, etiqueta.id),
                                    'Etiqueta eliminada.',
                                  ).then(() => {
                                    setPorConfirmar(null);
                                  });
                                }}
                              >
                                Confirmar
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setPorConfirmar(null);
                                }}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setPorConfirmar(etiqueta.id);
                              }}
                            >
                              Eliminar
                            </Button>
                          )}
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </Stack>
  );
}
