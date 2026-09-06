/**
 * Listado administrativo de un tipo publicable.
 *
 * Existe porque hay **cuatro** consumidores reales cuyo listado es identico
 * salvo el recurso: la alternativa serian cuatro archivos con la misma tabla.
 * No es una abstraccion especulativa ni un `DataGrid` generico — solo sabe
 * pintar contenido administrativo.
 *
 * Diferencias con un listado publico, todas del contrato
 * (`api-contracts.md` seccion 14.6):
 *
 * - Devuelve **los tres estados**, no solo `published`.
 * - El unico filtro es `status` (decision **D-012-M**), y vive en la URL para
 *   que un filtro concreto se pueda compartir y recargar.
 * - Viene ordenado `updated_at` descendente, no `published_at`: un borrador no
 *   tiene fecha de publicacion.
 */
import { Link, useSearchParams } from 'react-router';

import { EstadoBadge } from './EstadoBadge';
import styles from './ListadoAdministrativo.module.css';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  Stack,
} from '../../components';
import { formatearFechaLarga } from '../../lib/format/date';
import { rutaDeCreacion, rutaDeEdicion } from '../../lib/rutasAdmin';
import type { SeccionDeContenidoAdmin } from '../../lib/rutasAdmin';
import type { EstadoDePublicacion, Pagina } from '../../services/admin';
import type { EstadoDeRecurso } from '../../hooks/useAsyncResource';

/** Lo minimo que el listado necesita de cualquiera de los cuatro tipos. */
export interface ElementoDeListado {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: EstadoDePublicacion;
  readonly updated_at: string;
}

/** Los tres estados, mas «todos», como opciones del filtro. */
const FILTROS: readonly { readonly valor: string; readonly texto: string }[] = [
  { valor: '', texto: 'Todos los estados' },
  { valor: 'draft', texto: 'Borradores' },
  { valor: 'published', texto: 'Publicados' },
  { valor: 'archived', texto: 'Archivados' },
];

export interface ListadoAdministrativoProps<T extends ElementoDeListado> {
  readonly titulo: string;
  readonly seccion: SeccionDeContenidoAdmin;
  readonly recurso: EstadoDeRecurso<Pagina<T>>;
  readonly onReintentar: () => void;
}

export function ListadoAdministrativo<T extends ElementoDeListado>({
  titulo,
  seccion,
  recurso,
  onReintentar,
}: ListadoAdministrativoProps<T>) {
  const [parametros, setParametros] = useSearchParams();
  const filtro = parametros.get('status') ?? '';

  function cambiarFiltro(valor: string) {
    const siguientes = new URLSearchParams(parametros);
    if (valor === '') {
      siguientes.delete('status');
    } else {
      siguientes.set('status', valor);
    }
    // Cambiar de filtro vuelve a la primera pagina: la anterior ya no aplica.
    siguientes.delete('page');
    setParametros(siguientes);
  }

  return (
    <Stack gap="lg">
      <Stack direction="horizontal" gap="md" wrap align="center">
        <h1>{titulo}</h1>
        <Link to={rutaDeCreacion(seccion)}>Crear</Link>
      </Stack>

      <div>
        <label htmlFor="filtro-estado">Filtrar por estado</label>{' '}
        <select
          id="filtro-estado"
          value={filtro}
          onChange={(evento) => {
            cambiarFiltro(evento.target.value);
          }}
        >
          {FILTROS.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
      </div>

      {recurso.fase === 'cargando' ? <LoadingState /> : null}

      {recurso.fase === 'error' || recurso.fase === 'no-encontrado' ? (
        <ErrorState onRetry={onReintentar} />
      ) : null}

      {recurso.fase === 'exito' ? (
        recurso.datos.items.length === 0 ? (
          <EmptyState mensaje="No hay contenido que coincida con el filtro.">
            <Button
              variant="secondary"
              onClick={() => {
                cambiarFiltro('');
              }}
            >
              Quitar filtro
            </Button>
          </EmptyState>
        ) : (
          <>
            <ul className={styles['lista']}>
              {recurso.datos.items.map((elemento) => (
                <li key={elemento.id}>
                  <Card>
                    <Stack gap="2xs">
                      <Link to={rutaDeEdicion(seccion, elemento.id)}>{elemento.title}</Link>
                      <Stack direction="horizontal" gap="sm" wrap align="center">
                        <EstadoBadge estado={elemento.status} />
                        <span className={styles['meta']}>{elemento.slug}</span>
                        <span className={styles['meta']}>
                          Modificado el {formatearFechaLarga(elemento.updated_at)}
                        </span>
                      </Stack>
                    </Stack>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={recurso.datos.page} pages={recurso.datos.pages} />
          </>
        )
      ) : null}
    </Stack>
  );
}
