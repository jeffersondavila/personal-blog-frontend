/**
 * Seleccion de etiquetas de un contenido.
 *
 * El contrato es `tag_ids: [UUID]` con **reemplazo completo** en cada escritura
 * (`api-contracts.md` seccion 14.3): no hay «anadir» ni «quitar» por separado, y
 * por eso la interfaz es un conjunto de casillas y no dos listas.
 *
 * Un `fieldset` con `legend` en lugar de un `label` suelto: el nombre accesible
 * pertenece al **grupo**, no a cada casilla, y esa es la construccion nativa
 * para expresarlo (requisito **A-03**).
 */
import { Stack } from '../../components';
import type { EtiquetaAdministrativa } from '../../services/admin';

export interface TagPickerProps {
  readonly etiquetas: readonly EtiquetaAdministrativa[];
  readonly seleccionadas: readonly string[];
  readonly onChange: (ids: readonly string[]) => void;
}

export function TagPicker({ etiquetas, seleccionadas, onChange }: TagPickerProps) {
  if (etiquetas.length === 0) {
    return <p>Todavía no hay etiquetas. Puedes crearlas en la sección de etiquetas.</p>;
  }

  function alternar(id: string, marcada: boolean) {
    onChange(marcada ? [...seleccionadas, id] : seleccionadas.filter((valor) => valor !== id));
  }

  return (
    <fieldset>
      <legend>Etiquetas</legend>
      <Stack direction="horizontal" gap="md" wrap>
        {etiquetas.map((etiqueta) => (
          <label key={etiqueta.id}>
            <input
              type="checkbox"
              checked={seleccionadas.includes(etiqueta.id)}
              onChange={(evento) => {
                alternar(etiqueta.id, evento.target.checked);
              }}
            />{' '}
            {etiqueta.name}
          </label>
        ))}
      </Stack>
    </fieldset>
  );
}
