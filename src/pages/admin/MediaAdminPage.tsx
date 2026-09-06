/**
 * Biblioteca de medios (`USER_FLOWS.md` B.4 y B.5).
 *
 * Carga `multipart` con el campo `archivo` y un `alt_text` **opcional**
 * (decision **D-010-N**: el texto se escribe al *usar* la imagen, no al
 * subirla). El `FormData` lo entrega el cliente sin tocar y sin `Content-Type`
 * propio, para que el navegador escriba el `boundary` (decision **D-015-D**).
 *
 * Los limites —5 MiB y JPEG, PNG o WebP— se **anuncian**, no se imponen: quien
 * decide es el backend, que valida el tipo **decodificando** el archivo. Repetir
 * la validacion aqui daria una segunda definicion que puede divergir.
 *
 * Borrar exige confirmacion (B.5) y puede fallar con `409 media_in_use`, en cuyo
 * caso el backend dice **donde** se usa: esos usos se muestran tal cual llegan.
 * Nada se elimina de la lista antes de que el servidor confirme.
 *
 * Las imagenes se muestran con `access_url`, un enlace **temporal**. `object_key`
 * no existe en el contrato y aqui no se construye ninguna URL.
 */
import { useCallback, useRef, useState } from 'react';

import { useHttpClient } from '../../app/httpClientContext';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormFeedback,
  FormField,
  LoadingState,
  Pagination,
  Stack,
} from '../../components';
import { MediaImage } from '../../entities/media/MediaImage';
import { mensajeDeError, usosDelDetalle } from '../../features/admin/errores';
import { useCargaAdmin, useEscrituraAdmin } from '../../features/admin/useCargaAdmin';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useParametrosDeListado } from '../../hooks/useParametrosDeListado';
import { cargarMedio, eliminarMedio, listarMedios } from '../../services/admin';
import styles from './MediaAdminPage.module.css';

export function MediaAdminPage() {
  useDocumentTitle('Medios');
  const cliente = useHttpClient();
  const escribir = useEscrituraAdmin();
  const { page } = useParametrosDeListado();
  const entrada = useRef<HTMLInputElement>(null);

  const cargar = useCallback(
    (signal: AbortSignal) => listarMedios(cliente, page ? { page } : {}, signal),
    [cliente, page],
  );
  const recurso = useCargaAdmin(cargar);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usos, setUsos] = useState<readonly string[]>([]);
  const [exito, setExito] = useState<string | null>(null);
  const [porConfirmar, setPorConfirmar] = useState<string | null>(null);

  async function subir() {
    if (archivo === null || enviando) {
      return;
    }
    setEnviando(true);
    setError(null);
    setUsos([]);
    setExito(null);
    try {
      await escribir(() => cargarMedio(cliente, archivo, altText));
      setExito('Imagen cargada.');
      setArchivo(null);
      setAltText('');
      if (entrada.current !== null) {
        entrada.current.value = '';
      }
      recurso.reintentar();
    } catch (causa) {
      setError(mensajeDeError(causa, 'No se pudo cargar la imagen.'));
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(id: string) {
    setEnviando(true);
    setError(null);
    setUsos([]);
    setExito(null);
    try {
      await escribir(() => eliminarMedio(cliente, id));
      setExito('Imagen eliminada.');
      setPorConfirmar(null);
      recurso.reintentar();
    } catch (causa) {
      setError(mensajeDeError(causa, 'No se pudo eliminar la imagen.'));
      setUsos(usosDelDetalle(causa));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Stack gap="lg">
      <h1>Medios</h1>

      {error !== null ? (
        <FormFeedback tono="error" campos={usos}>
          {error}
        </FormFeedback>
      ) : null}
      {exito !== null ? <FormFeedback tono="exito">{exito}</FormFeedback> : null}

      <Card>
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            void subir();
          }}
          noValidate
        >
          <Stack gap="md">
            <h2>Cargar una imagen</h2>
            <FormField
              label="Archivo"
              required
              descripcion="JPEG, PNG o WebP, hasta 5 MiB. El servidor comprueba el tipo decodificando el archivo."
            >
              {(atributos) => (
                <input
                  {...atributos}
                  ref={entrada}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(evento) => {
                    setArchivo(evento.target.files?.[0] ?? null);
                  }}
                />
              )}
            </FormField>
            <FormField
              label="Texto alternativo"
              descripcion="Opcional al cargar: puedes escribirlo cuando uses la imagen."
            >
              {(atributos) => (
                <input
                  {...atributos}
                  type="text"
                  maxLength={255}
                  value={altText}
                  onChange={(evento) => {
                    setAltText(evento.target.value);
                  }}
                />
              )}
            </FormField>
            <div>
              <Button type="submit" disabled={enviando || archivo === null}>
                {enviando ? 'Subiendo…' : 'Subir'}
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
          <EmptyState mensaje="La biblioteca está vacía." />
        ) : (
          <>
            <ul className={styles['galeria']}>
              {recurso.estado.datos.items.map((medio) => (
                <li key={medio.id}>
                  <Card>
                    <Stack gap="xs">
                      <MediaImage medio={medio} className={styles['miniatura']} />
                      <strong>{medio.original_filename}</strong>
                      <span className={styles['meta']}>
                        {medio.mime_type} · {Math.round(medio.size_bytes / 1024)} KiB
                      </span>
                      <span className={styles['meta']}>
                        {medio.alt_text === null || medio.alt_text === ''
                          ? 'Sin texto alternativo'
                          : `Alt: ${medio.alt_text}`}
                      </span>
                      {porConfirmar === medio.id ? (
                        <Stack direction="horizontal" gap="sm" wrap>
                          <span role="alert">¿Eliminar esta imagen?</span>
                          <Button
                            disabled={enviando}
                            onClick={() => {
                              void borrar(medio.id);
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
                        </Stack>
                      ) : (
                        <div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setPorConfirmar(medio.id);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </Stack>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={recurso.estado.datos.page} pages={recurso.estado.datos.pages} />
          </>
        )
      ) : null}
    </Stack>
  );
}
