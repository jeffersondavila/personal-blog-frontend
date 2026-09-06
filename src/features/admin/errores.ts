/**
 * Traduccion de los errores del contrato administrativo a la interfaz.
 *
 * `api-contracts.md` seccion 7 es explicito: **`code` es estable y el frontend
 * puede reaccionar a el; `message` puede cambiar de redaccion**. Por eso aqui
 * nunca se ramifica por texto.
 *
 * Y lo contrario tambien importa: no se inventa comportamiento especializado
 * para codigos que el contrato no usa. `400` y `503` existen en la seccion 8
 * pero ninguna operacion administrativa los declara, asi que caen en el
 * generico.
 */
import { HttpError } from '../../services/http';

/**
 * `401`: la sesion termino, decida el servidor lo que decida.
 *
 * Los cuatro casos internos —ausente, desconocida, caducada, revocada— son
 * **indistinguibles por contrato** (seccion 13.4) y al panel le sirven para lo
 * mismo: volver a entrar.
 */
export function esSesionCaducada(causa: unknown): boolean {
  return causa instanceof HttpError && causa.status === 401;
}

/**
 * `403`: el `Origin` no esta permitido.
 *
 * **No es una sesion caducada**, y confundirlos produce un bucle: redirigir al
 * acceso no arregla una lista de origenes mal configurada en el backend, y el
 * `POST` del propio acceso volveria a fallar igual.
 */
export function esOrigenNoPermitido(causa: unknown): boolean {
  return causa instanceof HttpError && causa.status === 403;
}

/** `429`, el limite de intentos de acceso. */
export function esLimiteDeIntentos(causa: unknown): boolean {
  return causa instanceof HttpError && causa.status === 429;
}

/** `code` estable del backend, si la respuesta siguio el modelo comun. */
export function codigoDeError(causa: unknown): string | undefined {
  return causa instanceof HttpError ? causa.code : undefined;
}

/** Campos que el backend senala en `details.campos`, por ejemplo al publicar. */
export function camposDelDetalle(causa: unknown): readonly string[] {
  if (!(causa instanceof HttpError)) {
    return [];
  }
  const campos = causa.details?.['campos'];
  return Array.isArray(campos)
    ? campos.filter((valor): valor is string => typeof valor === 'string')
    : [];
}

/** Usos que el backend devuelve al rechazar el borrado de un medio en uso. */
export function usosDelDetalle(causa: unknown): readonly string[] {
  if (!(causa instanceof HttpError)) {
    return [];
  }
  const usos = causa.details?.['usos'];
  if (!Array.isArray(usos)) {
    return [];
  }
  return usos.map((uso) => (typeof uso === 'string' ? uso : JSON.stringify(uso)));
}

/** Etiquetas legibles de los campos que el contrato puede nombrar. */
const NOMBRES_DE_CAMPO: Readonly<Record<string, string>> = {
  title: 'Título',
  slug: 'Slug',
  summary: 'Resumen',
  content: 'Contenido',
  seo_description: 'Descripción SEO',
  book_title: 'Título del libro',
  book_author: 'Autor del libro',
  rating: 'Valoración',
  video_url: 'URL del video',
  provider: 'Proveedor',
  cover_alt_text: 'Texto alternativo de la portada',
  thumbnail_alt_text: 'Texto alternativo de la miniatura',
  photo_alt_text: 'Texto alternativo de la foto',
};

export function nombreDeCampo(campo: string): string {
  return NOMBRES_DE_CAMPO[campo] ?? campo;
}

/** Mensajes por `code`, para los que el contrato declara semantica propia. */
const MENSAJES: Readonly<Record<string, string>> = {
  slug_already_exists: 'Ya existe otro contenido de este tipo con ese slug.',
  slug_is_immutable: 'El slug no puede cambiarse: este contenido ya se publicó alguna vez.',
  invalid_slug: 'El slug solo admite minúsculas, dígitos y guiones simples.',
  invalid_rating: 'La valoración debe ser un número entero del 1 al 5.',
  unknown_reference: 'Alguna de las referencias enviadas no existe.',
  media_in_use: 'La imagen está en uso y no puede eliminarse.',
  alt_text_conflict:
    'La imagen ya tiene un texto alternativo distinto. No se sobrescribe: el texto es un dato de la imagen, no de este contenido.',
  media_without_alt_text: 'La foto del perfil necesita un texto alternativo.',
  invalid_image: 'El archivo no es una imagen que se pueda leer.',
  payload_too_large: 'La imagen supera el límite de 5 MiB.',
  unsupported_image_type: 'Formato no admitido. Se aceptan JPEG, PNG y WebP.',
  resource_not_found: 'El elemento solicitado no existe.',
  forbidden:
    'El servidor rechazó el origen de la petición. Es configuración del backend, no un problema de tu sesión.',
};

/**
 * Mensaje para humanos.
 *
 * **Nunca** se muestra el cuerpo crudo del servidor: `HttpError` ya lo descarta
 * (requisito **S-07**), y aqui se prefiere un texto propio por `code` antes que
 * el `message` del backend, que puede cambiar de redaccion.
 */
export function mensajeDeError(
  causa: unknown,
  generico = 'No se pudo completar la operación.',
): string {
  const codigo = codigoDeError(causa);
  if (codigo !== undefined && codigo in MENSAJES) {
    return MENSAJES[codigo] ?? generico;
  }
  if (causa instanceof HttpError && causa.status === 409) {
    return 'El estado del elemento no permite esta operación. Vuelve a cargarlo.';
  }
  return generico;
}
