/**
 * Imagen de un `MedioPublico` (decision D-014-B; requisito A-04).
 *
 * El unico dato de acceso es `access_url`: un enlace **temporal** que el backend
 * firma al servir la respuesta (`api-contracts.md`, seccion 12). Aqui no se
 * construye ninguna URL, no se conoce ningun bucket ni clave, y el valor no se
 * guarda en ningun sitio: vive en el estado de la respuesta y muere con el.
 *
 * `alt_text` se renderiza tal cual llega. El contenido publicado siempre lo
 * trae (decision D-012-R de `Task/012`); si defensivamente llegara `null`, la
 * imagen se marca **decorativa** (`alt=""`) y no se inventa una descripcion:
 * un texto inventado seria peor para quien depende de el que ninguno.
 *
 * Sin medio, o con un medio sin enlace, no se renderiza nada: nunca una
 * imagen rota.
 */
import type { MedioPublico } from '../../services/public/types';

export interface MediaImageProps {
  readonly medio: MedioPublico | null | undefined;
  readonly className?: string | undefined;
  /**
   * `alta` para la imagen principal de una pagina, que se ve sin desplazarse:
   * se carga de inmediato. El resto se carga en diferido.
   */
  readonly prioridad?: 'alta' | 'normal' | undefined;
}

export function MediaImage({ medio, className, prioridad = 'normal' }: MediaImageProps) {
  if (medio === null || medio === undefined) {
    return null;
  }
  if (medio.access_url === null) {
    return null;
  }

  return (
    <img
      src={medio.access_url}
      alt={medio.alt_text ?? ''}
      {...(medio.width !== null ? { width: medio.width } : {})}
      {...(medio.height !== null ? { height: medio.height } : {})}
      {...(prioridad === 'alta' ? {} : { loading: 'lazy' as const })}
      {...(className !== undefined ? { className } : {})}
    />
  );
}
