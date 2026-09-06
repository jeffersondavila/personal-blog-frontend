/**
 * Ciclo completo de crear y editar un contenido publicable.
 *
 * Los cuatro tipos comparten **el ciclo** —cargar, editar, guardar,
 * transicionar— y difieren en **los campos**. Aqui vive el ciclo; los campos los
 * aporta cada tipo a traves de `configuracion`, que es tipada: un tipo no puede
 * mandar un campo que su cuerpo no admite.
 *
 * Lo que este componente **no** hace, y es deliberado:
 *
 * - No conoce ningun campo propio de ningun tipo. Nada de `rating` ni de
 *   `provider` aparece en este archivo.
 * - No decide que transiciones existen: lo deriva `PublishActions` del contrato.
 * - No envia `status` ni `published_at`: no son escribibles (**D-012-A**).
 */
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { ContenidoForm } from './ContenidoForm';
import { VALORES_COMUNES_INICIALES } from './valoresComunes';
import type { ValoresComunes } from './valoresComunes';
import { PublishActions } from './PublishActions';
import { TagPicker } from './TagPicker';
import { useHttpClient } from '../../app/httpClientContext';
import { ErrorState, LoadingState, Stack } from '../../components';
import { camposDelDetalle, mensajeDeError, nombreDeCampo } from '../admin/errores';
import { useCargaAdmin, useEscrituraAdmin } from '../admin/useCargaAdmin';
import { MarkdownEditor } from '../markdown/MarkdownEditor';
import { MediaPicker } from '../media/MediaPicker';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { rutaDeEdicion } from '../../lib/rutasAdmin';
import type { SeccionDeContenidoAdmin } from '../../lib/rutasAdmin';
import { actualizar, crear, listarEtiquetas, obtener, transicionar } from '../../services/admin';
import type {
  EtiquetaAdministrativa,
  MedioAdministrativo,
  RecursoDeContenido,
  Transicion,
} from '../../services/admin';

/** Lo minimo que la pagina necesita leer de cualquier respuesta del contrato. */
export interface RespuestaComun {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly status: string;
  readonly published_at: string | null;
  readonly featured: boolean;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
  readonly tags: readonly { readonly slug: string }[];
}

/** Como se traduce un tipo concreto entre el contrato y el formulario. */
export interface ConfiguracionDeTipo<Respuesta extends RespuestaComun, Cuerpo, Extra> {
  readonly titulo: string;
  readonly seccion: SeccionDeContenidoAdmin;
  readonly recurso: RecursoDeContenido<Respuesta, Cuerpo>;
  /** Campo de imagen del tipo, o `null` si no tiene. */
  readonly campoDeImagen: 'cover' | 'thumbnail' | null;
  /** `true` en los tres tipos cuyo contenido principal es Markdown. */
  readonly usaMarkdown: boolean;
  readonly extraInicial: Extra;
  readonly extraDesdeRespuesta: (respuesta: Respuesta) => Extra;
  readonly imagenDesdeRespuesta: (respuesta: Respuesta) => MedioAdministrativo | null;
  readonly renderExtras: (extra: Extra, cambiar: (extra: Extra) => void) => React.ReactNode;
  readonly aCuerpo: (datos: {
    readonly comunes: ValoresComunes;
    readonly extra: Extra;
    readonly contenido: string;
    readonly tagIds: readonly string[];
    readonly imagenId: string | null;
    readonly altText: string;
    readonly imagenYaTieneTexto: boolean;
  }) => Cuerpo;
}

export interface PaginaDeContenidoProps<Respuesta extends RespuestaComun, Cuerpo, Extra> {
  readonly configuracion: ConfiguracionDeTipo<Respuesta, Cuerpo, Extra>;
  /** `true` en la ruta `/nuevo`. */
  readonly creando: boolean;
}

export function PaginaDeContenido<Respuesta extends RespuestaComun, Cuerpo, Extra>({
  configuracion,
  creando,
}: PaginaDeContenidoProps<Respuesta, Cuerpo, Extra>) {
  const cliente = useHttpClient();
  const navegar = useNavigate();
  const escribir = useEscrituraAdmin();
  const { id } = useParams();

  const [comunes, setComunes] = useState<ValoresComunes>(VALORES_COMUNES_INICIALES);
  const [extra, setExtra] = useState<Extra>(configuracion.extraInicial);
  const [contenido, setContenido] = useState('');
  const [tagIds, setTagIds] = useState<readonly string[]>([]);
  const [imagen, setImagen] = useState<MedioAdministrativo | null>(null);
  const [altText, setAltText] = useState('');
  const [publicadoAlguna, setPublicadoAlguna] = useState(false);
  /** Ultimo elemento ya volcado al formulario. Evita pisar lo que se escribe. */
  const [sincronizado, setSincronizado] = useState<Respuesta | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [campos, setCampos] = useState<readonly string[]>([]);
  const [exito, setExito] = useState<string | undefined>(undefined);

  useDocumentTitle(creando ? `Crear ${configuracion.titulo}` : `Editar ${configuracion.titulo}`);

  /* --- Carga del elemento existente y del catalogo de etiquetas ----------- */
  const cargar = useCallback(
    async (
      signal: AbortSignal,
    ): Promise<{
      readonly elemento: Respuesta | null;
      readonly etiquetas: readonly EtiquetaAdministrativa[];
    }> => {
      const catalogo = listarEtiquetas(cliente, { pageSize: 50 }, signal);
      if (creando || id === undefined) {
        return { elemento: null, etiquetas: (await catalogo).items };
      }
      const [elemento, etiquetas] = await Promise.all([
        obtener(cliente, configuracion.recurso, id, signal),
        catalogo,
      ]);
      return { elemento, etiquetas: etiquetas.items };
    },
    [cliente, configuracion.recurso, creando, id],
  );

  const recurso = useCargaAdmin(cargar);

  /*
   * **Se sincroniza durante el render, no en un efecto.** Es el patron que React
   * documenta para derivar estado de datos que llegan de fuera: un `useEffect`
   * con `setState` provoca un render en cascada —React lo pinta, el efecto lo
   * cambia y lo vuelve a pintar— y ademas deja un instante con el formulario
   * vacio sobre datos ya disponibles.
   *
   * El centinela es el propio elemento cargado: mientras sea el mismo objeto no
   * se toca nada, asi que lo que el administrador escriba no se pisa.
   */
  const cargado = recurso.estado.fase === 'exito' ? recurso.estado.datos.elemento : null;

  if (cargado !== null && cargado !== sincronizado) {
    setSincronizado(cargado);
    setComunes({
      title: cargado.title,
      slug: cargado.slug,
      summary: cargado.summary ?? '',
      featured: cargado.featured,
      seo_title: cargado.seo_title ?? '',
      seo_description: cargado.seo_description ?? '',
    });
    setExtra(configuracion.extraDesdeRespuesta(cargado));
    setImagen(configuracion.imagenDesdeRespuesta(cargado));
    setPublicadoAlguna(cargado.published_at !== null);
    if ('content' in cargado && typeof cargado.content === 'string') {
      setContenido(cargado.content);
    }
    if (recurso.estado.fase === 'exito') {
      const slugs = new Set(cargado.tags.map((etiqueta) => etiqueta.slug));
      setTagIds(recurso.estado.datos.etiquetas.filter((e) => slugs.has(e.slug)).map((e) => e.id));
    }
  }

  if (recurso.estado.fase === 'cargando') {
    return <LoadingState />;
  }
  if (recurso.estado.fase === 'error' || recurso.estado.fase === 'no-encontrado') {
    return <ErrorState onRetry={recurso.reintentar} />;
  }

  const etiquetas = recurso.estado.datos.etiquetas;
  const imagenYaTieneTexto = imagen !== null && (imagen.alt_text ?? '') !== '';

  /*
   * El estado se **deriva del elemento cargado**, no de un `useState` con valor
   * por defecto. Con un `draft` inicial, las acciones aparecian un instante como
   * las de un borrador —«Publicar»— aunque el contenido estuviera archivado. Un
   * boton que ofrece una transicion imposible es peor que ninguno.
   */
  const elementoCargado = recurso.estado.datos.elemento;

  function cuerpoActual(): Cuerpo {
    return configuracion.aCuerpo({
      comunes,
      extra,
      contenido,
      tagIds,
      imagenId: imagen?.id ?? null,
      altText,
      imagenYaTieneTexto,
    });
  }

  async function guardar() {
    setEnviando(true);
    setError(undefined);
    setCampos([]);
    setExito(undefined);
    try {
      if (creando) {
        const creado = await escribir(() => crear(cliente, configuracion.recurso, cuerpoActual()));
        await navegar(rutaDeEdicion(configuracion.seccion, creado.id), { replace: true });
        return;
      }
      if (id !== undefined) {
        await escribir(() => actualizar(cliente, configuracion.recurso, id, cuerpoActual()));
        setExito('Cambios guardados.');
        recurso.reintentar();
      }
    } catch (causa) {
      setError(mensajeDeError(causa, 'No se pudo guardar el contenido.'));
      setCampos(camposDelDetalle(causa).map(nombreDeCampo));
    } finally {
      setEnviando(false);
    }
  }

  async function aplicarTransicion(transicion: Transicion) {
    if (id === undefined) {
      return;
    }
    setEnviando(true);
    setError(undefined);
    setCampos([]);
    setExito(undefined);
    try {
      await escribir(() => transicionar(cliente, configuracion.recurso, id, transicion));
      setExito('Estado actualizado.');
      recurso.reintentar();
    } catch (causa) {
      setError(mensajeDeError(causa, 'No se pudo cambiar el estado.'));
      setCampos(camposDelDetalle(causa).map(nombreDeCampo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ContenidoForm
      titulo={creando ? `Crear ${configuracion.titulo}` : `Editar ${configuracion.titulo}`}
      valores={comunes}
      onChange={setComunes}
      slugBloqueado={publicadoAlguna}
      enviando={enviando}
      onSubmit={() => {
        void guardar();
      }}
      {...(error !== undefined ? { errorGeneral: error } : {})}
      camposDelError={campos}
      {...(exito !== undefined ? { exito } : {})}
      extras={
        <Stack gap="md">
          {configuracion.renderExtras(extra, setExtra)}

          {configuracion.usaMarkdown ? (
            <MarkdownEditor label="Contenido" value={contenido} onChange={setContenido} />
          ) : null}

          {configuracion.campoDeImagen !== null ? (
            <MediaPicker
              label={configuracion.campoDeImagen === 'cover' ? 'Portada' : 'Miniatura'}
              seleccionada={imagen}
              onSeleccionar={setImagen}
              altText={altText}
              onAltTextChange={setAltText}
            />
          ) : null}

          <TagPicker etiquetas={etiquetas} seleccionadas={tagIds} onChange={setTagIds} />
        </Stack>
      }
      acciones={
        creando || elementoCargado === null ? null : (
          <section aria-labelledby="ciclo">
            <Stack gap="sm">
              <h2 id="ciclo">Estado de publicación</h2>
              <PublishActions
                recurso={configuracion.recurso}
                estado={elementoCargado.status}
                enCurso={enviando}
                onTransicion={(transicion) => {
                  void aplicarTransicion(transicion);
                }}
              />
            </Stack>
          </section>
        )
      }
    />
  );
}
