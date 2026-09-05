/**
 * Esquema de permitidos del render Markdown (ADR-005, decision 4).
 *
 * Parte del esquema de referencia de GitHub que trae `rehype-sanitize` y lo
 * **restringe**: `href` solo `http`, `https` y `mailto`; `src` solo `http` y
 * `https`. Las rutas relativas (`/articulos/otro`, `#seccion`) no llevan
 * protocolo y siguen permitidas. Los `id` que el contenido declare se prefijan
 * para que no puedan pisar los del layout (`#contenido`).
 *
 * Vive en su propio modulo —y no junto al componente— para que el archivo del
 * renderizador exporte solo componentes, que es lo que la recarga en caliente
 * de React exige.
 */
import { defaultSchema, type Options as EsquemaDeSanitizacion } from 'rehype-sanitize';

export const ESQUEMA_DE_SANITIZACION: EsquemaDeSanitizacion = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
  clobberPrefix: 'contenido-',
};
