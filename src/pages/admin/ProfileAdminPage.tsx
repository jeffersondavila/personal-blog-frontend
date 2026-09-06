/**
 * Edicion del perfil «Quién soy» (`USER_FLOWS.md` B.10).
 *
 * El perfil es un **singleton**: existe exactamente uno y **no se crea ni se
 * elimina por API** (decision **D-012-U**). Un `404` aqui no es un fallo del
 * panel: significa que todavia no hay semilla, que es de `Task/022`. Se dice
 * exactamente eso en lugar de mostrar un error generico.
 *
 * Dos particularidades del contrato:
 *
 * - Los **enlaces sociales** son un array ordenado de `{label, url}` y su orden
 *   de presentacion **es el indice** (decision **D-012-Q**): no hay campo de
 *   orden que rellenar ni que pueda quedar duplicado.
 * - El perfil **siempre esta visible**, asi que su foto exige texto alternativo
 *   **al editar**, no al publicar: `PUT` con una imagen sin texto responde
 *   `422 media_without_alt_text`.
 */
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../app/httpClientContext';
import {
  Button,
  Card,
  ErrorState,
  FormFeedback,
  FormField,
  LoadingState,
  Stack,
} from '../../components';
import { mensajeDeError } from '../../features/admin/errores';
import { useCargaAdmin, useEscrituraAdmin } from '../../features/admin/useCargaAdmin';
import { MarkdownEditor } from '../../features/markdown/MarkdownEditor';
import { MediaPicker } from '../../features/media/MediaPicker';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { guardarPerfil, obtenerPerfil } from '../../services/admin';
import type { EnlaceSocial, MedioAdministrativo, PerfilAdministrativo } from '../../services/admin';

export function ProfileAdminPage() {
  useDocumentTitle('Perfil');
  const cliente = useHttpClient();
  const escribir = useEscrituraAdmin();

  const cargar = useCallback((signal: AbortSignal) => obtenerPerfil(cliente, signal), [cliente]);
  const recurso = useCargaAdmin(cargar);

  const [nombre, setNombre] = useState('');
  const [titular, setTitular] = useState('');
  const [biografia, setBiografia] = useState('');
  const [correo, setCorreo] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [enlaces, setEnlaces] = useState<readonly EnlaceSocial[]>([]);
  const [foto, setFoto] = useState<MedioAdministrativo | null>(null);
  const [altText, setAltText] = useState('');
  const [sincronizado, setSincronizado] = useState<PerfilAdministrativo | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  /*
   * Sincronizacion **en render**, no en efecto: mismo criterio que
   * `PaginaDeContenido`. El centinela es el perfil cargado, asi que lo que se
   * este escribiendo no se pisa en cada re-render.
   */
  const cargado = recurso.estado.fase === 'exito' ? recurso.estado.datos : null;

  if (cargado !== null && cargado !== sincronizado) {
    setSincronizado(cargado);
    setNombre(cargado.full_name);
    setTitular(cargado.headline ?? '');
    setBiografia(cargado.biography);
    setCorreo(cargado.contact_email ?? '');
    setSeoTitle(cargado.seo_title ?? '');
    setSeoDescription(cargado.seo_description ?? '');
    setEnlaces(cargado.social_links);
    setFoto(cargado.photo);
  }

  if (recurso.estado.fase === 'cargando') {
    return <LoadingState />;
  }

  /*
   * `404` en el perfil no es «error»: es «todavia no hay semilla». Se separa del
   * fallo real para no pedir a nadie que reintente algo que no va a cambiar.
   */
  if (recurso.estado.fase === 'no-encontrado') {
    return (
      <Card>
        <Stack gap="sm">
          <h1>Perfil</h1>
          <p>
            Todavía no existe el perfil. El perfil no se crea desde el panel: llega con la semilla
            local (<code>Task/022</code>) o con la configuración de producción.
          </p>
        </Stack>
      </Card>
    );
  }

  if (recurso.estado.fase === 'error') {
    return <ErrorState onRetry={recurso.reintentar} />;
  }

  const fotoYaTieneTexto = foto !== null && (foto.alt_text ?? '') !== '';

  async function guardar() {
    if (enviando) {
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await escribir(() =>
        guardarPerfil(cliente, {
          full_name: nombre,
          headline: titular.trim() === '' ? null : titular.trim(),
          biography: biografia,
          contact_email: correo.trim() === '' ? null : correo.trim(),
          photo_id: foto?.id ?? null,
          seo_title: seoTitle.trim() === '' ? null : seoTitle.trim(),
          seo_description: seoDescription.trim() === '' ? null : seoDescription.trim(),
          social_links: enlaces,
          ...(foto !== null && !fotoYaTieneTexto && altText.trim() !== ''
            ? { photo_alt_text: altText.trim() }
            : {}),
        }),
      );
      setExito('Perfil guardado.');
      recurso.reintentar();
    } catch (causa) {
      setError(mensajeDeError(causa, 'No se pudo guardar el perfil.'));
    } finally {
      setEnviando(false);
    }
  }

  function cambiarEnlace(indice: number, campo: keyof EnlaceSocial, valor: string) {
    setEnlaces((actuales) =>
      actuales.map((enlace, i) => (i === indice ? { ...enlace, [campo]: valor } : enlace)),
    );
  }

  return (
    <Stack gap="lg">
      <h1>Perfil</h1>

      {error !== null ? <FormFeedback tono="error">{error}</FormFeedback> : null}
      {exito !== null ? <FormFeedback tono="exito">{exito}</FormFeedback> : null}

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          void guardar();
        }}
        noValidate
      >
        <Stack gap="md">
          <FormField label="Nombre completo" required>
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                maxLength={120}
                value={nombre}
                onChange={(evento) => {
                  setNombre(evento.target.value);
                }}
              />
            )}
          </FormField>

          <FormField label="Titular">
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                maxLength={200}
                value={titular}
                onChange={(evento) => {
                  setTitular(evento.target.value);
                }}
              />
            )}
          </FormField>

          <MarkdownEditor label="Biografía" value={biografia} onChange={setBiografia} />

          <FormField label="Correo de contacto">
            {(atributos) => (
              <input
                {...atributos}
                type="email"
                maxLength={254}
                value={correo}
                onChange={(evento) => {
                  setCorreo(evento.target.value);
                }}
              />
            )}
          </FormField>

          <MediaPicker
            label="Foto"
            seleccionada={foto}
            onSeleccionar={setFoto}
            altText={altText}
            onAltTextChange={setAltText}
          />

          <fieldset>
            <legend>Enlaces sociales</legend>
            <Stack gap="sm">
              {enlaces.map((enlace, indice) => (
                // El indice ES el orden de presentacion (D-012-Q).
                <Stack key={indice} gap="xs">
                  <FormField label={`Etiqueta del enlace ${String(indice + 1)}`} required>
                    {(atributos) => (
                      <input
                        {...atributos}
                        type="text"
                        maxLength={60}
                        value={enlace.label}
                        onChange={(evento) => {
                          cambiarEnlace(indice, 'label', evento.target.value);
                        }}
                      />
                    )}
                  </FormField>
                  <FormField label={`URL del enlace ${String(indice + 1)}`} required>
                    {(atributos) => (
                      <input
                        {...atributos}
                        type="url"
                        value={enlace.url}
                        onChange={(evento) => {
                          cambiarEnlace(indice, 'url', evento.target.value);
                        }}
                      />
                    )}
                  </FormField>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEnlaces((actuales) => actuales.filter((_, i) => i !== indice));
                      }}
                    >
                      Quitar enlace {String(indice + 1)}
                    </Button>
                  </div>
                </Stack>
              ))}
              <div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnlaces((actuales) => [...actuales, { label: '', url: '' }]);
                  }}
                >
                  Añadir enlace
                </Button>
              </div>
            </Stack>
          </fieldset>

          <FormField label="Título SEO">
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                maxLength={70}
                value={seoTitle}
                onChange={(evento) => {
                  setSeoTitle(evento.target.value);
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
                value={seoDescription}
                onChange={(evento) => {
                  setSeoDescription(evento.target.value);
                }}
              />
            )}
          </FormField>

          <div>
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </Stack>
      </form>
    </Stack>
  );
}
