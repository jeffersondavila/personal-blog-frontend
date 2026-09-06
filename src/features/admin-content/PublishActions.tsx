/**
 * Acciones de ciclo de vida de un contenido.
 *
 * Las transiciones son **subrecursos dedicados** (decision **D-012-A**), no un
 * campo `status`: `POST /{id}/publish`, `/unpublish` y `/archive`.
 *
 * Que botones aparecen **no lo decide esta interfaz**: lo deriva
 * `transicionesDisponibles` del contrato. `unpublish` no se dibuja para videos
 * ni proyectos porque **la ruta no existe** en OpenAPI, no porque alguien se
 * acordara de ocultarlo. Y `archived` no ofrece ninguna: `archived → *` no
 * existe.
 *
 * Repetir una transicion es `409`, **no** una operacion idempotente (decision
 * **D-012-B**): el panel no reintenta; informa y deja que se recargue.
 */
import { Button, Stack } from '../../components';
import { transicionesDisponibles } from '../../services/admin';
import type { RecursoDeContenido, Transicion } from '../../services/admin';

const ETIQUETAS: Readonly<Record<Transicion, string>> = {
  publish: 'Publicar',
  unpublish: 'Despublicar',
  archive: 'Archivar',
};

export interface PublishActionsProps<R, C> {
  readonly recurso: RecursoDeContenido<R, C>;
  readonly estado: string;
  readonly enCurso: boolean;
  readonly onTransicion: (transicion: Transicion) => void;
}

export function PublishActions<R, C>({
  recurso,
  estado,
  enCurso,
  onTransicion,
}: PublishActionsProps<R, C>) {
  const disponibles = transicionesDisponibles(recurso, estado);

  if (disponibles.length === 0) {
    return <p>Un contenido archivado se conserva y no admite más transiciones.</p>;
  }

  return (
    <Stack direction="horizontal" gap="sm" wrap>
      {disponibles.map((transicion) => (
        <Button
          key={transicion}
          variant="secondary"
          disabled={enCurso}
          onClick={() => {
            onTransicion(transicion);
          }}
        >
          {ETIQUETAS[transicion]}
        </Button>
      ))}
    </Stack>
  );
}
