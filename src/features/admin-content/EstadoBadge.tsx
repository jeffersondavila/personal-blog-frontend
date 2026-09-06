/**
 * Estado de publicacion, mostrado con `Badge`.
 *
 * Los tres estados son los oficiales de `MVP_SCOPE.md` seccion 3.2 y no hay
 * ninguno mas: el mapa es cerrado y `EstadoDePublicacion` lo garantiza en
 * tiempo de compilacion.
 *
 * **El significado lo lleva el texto**, no el tono. `Badge` ya exige `children`
 * por esa razon (requisito **A-07**): quien no distingue los colores lee
 * «Borrador», «Publicado» o «Archivado» igual.
 */
import { Badge } from '../../components';
import type { BadgeTone } from '../../components';
import type { EstadoDePublicacion } from '../../services/admin';

const PRESENTACION: Readonly<
  Record<EstadoDePublicacion, { readonly texto: string; readonly tono: BadgeTone }>
> = {
  draft: { texto: 'Borrador', tono: 'neutral' },
  published: { texto: 'Publicado', tono: 'success' },
  archived: { texto: 'Archivado', tono: 'warning' },
};

export interface EstadoBadgeProps {
  readonly estado: EstadoDePublicacion;
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const { texto, tono } = PRESENTACION[estado];
  return <Badge tone={tono}>{texto}</Badge>;
}
