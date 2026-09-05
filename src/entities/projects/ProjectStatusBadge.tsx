/**
 * Estado del **trabajo** de un proyecto (`project_status`), que CONTENT_MODEL
 * seccion 3.5 distingue de su visibilidad (`status`).
 *
 * Mapa cerrado sobre los tres valores del dominio. `Badge` exige texto, asi que
 * el color nunca es la unica senal (A-07). Un valor que el contrato anadiera en
 * el futuro se muestra tal cual en tono neutro: la interfaz no se rompe por un
 * cambio compatible del API.
 */
import { Badge, type BadgeTone } from '../../components';
import type { ProjectWorkStatus } from '../../services/public/types';

const ESTADOS: Readonly<Record<ProjectWorkStatus, { texto: string; tono: BadgeTone }>> = {
  active: { texto: 'Activo', tono: 'success' },
  paused: { texto: 'En pausa', tono: 'warning' },
  completed: { texto: 'Terminado', tono: 'neutral' },
};

export interface ProjectStatusBadgeProps {
  readonly estado: ProjectWorkStatus;
}

export function ProjectStatusBadge({ estado }: ProjectStatusBadgeProps) {
  const conocido = (ESTADOS as Partial<Record<string, { texto: string; tono: BadgeTone }>>)[estado];
  return <Badge tone={conocido?.tono ?? 'neutral'}>{conocido?.texto ?? estado}</Badge>;
}
