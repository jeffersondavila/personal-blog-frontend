/**
 * Valores comunes del formulario de contenido y sus utilidades.
 *
 * Viven aparte del componente por una razon concreta: un modulo que exporta
 * componentes **y ademas** constantes o funciones rompe la recarga en caliente
 * de React (`eslint-plugin-react-refresh`). Es la misma separacion que
 * `Task/014` hizo entre `App.tsx` y sus contextos.
 */

/** Campos comunes a los cuatro tipos publicables. */
export interface ValoresComunes {
  readonly title: string;
  readonly slug: string;
  readonly summary: string;
  readonly featured: boolean;
  readonly seo_title: string;
  readonly seo_description: string;
}

export const VALORES_COMUNES_INICIALES: ValoresComunes = {
  title: '',
  slug: '',
  summary: '',
  featured: false,
  seo_title: '',
  seo_description: '',
};

/** Convierte un campo de texto vacio en el `null` que el contrato espera. */
export function textoOpcional(valor: string): string | null {
  const recortado = valor.trim();
  return recortado === '' ? null : recortado;
}
