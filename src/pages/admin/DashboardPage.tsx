/**
 * Dashboard basico del panel (`MVP_SCOPE.md` seccion 3.3).
 *
 * Alcance minimo **completo**, sus tres piezas:
 *
 * | Pieza | Peticiones | Fuente |
 * | --- | ---: | --- |
 * | Conteo por tipo y estado | **12** | `GET /api/v1/admin/{recurso}?status=…&page_size=1`, leyendo `total` |
 * | Ultimos elementos modificados | **4** | `GET /api/v1/admin/{recurso}?page_size=5`, ya `updated_at` desc |
 * | Ultimos eventos de auditoria | **1** | `GET /api/v1/admin/audit-events?page_size=5` |
 * | **Total** | **17** | |
 *
 * **17 peticiones**, no 16: 4 tipos × 3 estados = 12, mas 1 listado por tipo,
 * mas 1 de auditoria. No se reduce inventando agregacion: no existe un endpoint
 * de dashboard, y crearlo seria ampliar esta tarea a backend, que `STAGE-04` no
 * permite.
 *
 * Los tres bloques cargan **por separado y en paralelo**: un bloque que falle no
 * impide renderizar los otros dos, que es justo lo que hace util un panel
 * cuando algo va mal.
 *
 * Sin graficas, sin analitica y sin ningun KPI que no salga de un `total` del
 * contrato.
 */
import { useCallback } from 'react';
import { Link } from 'react-router';

import { useHttpClient } from '../../app/httpClientContext';
import { Badge, Card, EmptyState, ErrorState, LoadingState, Stack } from '../../components';
import { EstadoBadge } from '../../features/admin-content/EstadoBadge';
import { useCargaAdmin } from '../../features/admin/useCargaAdmin';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatearFechaLarga } from '../../lib/format/date';
import { rutaDeEdicion, RUTAS_ADMIN, SECCIONES_ADMIN } from '../../lib/rutasAdmin';
import type { SeccionDeContenidoAdmin } from '../../lib/rutasAdmin';
import { listar, listarEventosDeAuditoria, RECURSOS_PUBLICABLES } from '../../services/admin';
import type {
  EstadoDePublicacion,
  EventoDeAuditoria,
  RecursoDeContenido,
} from '../../services/admin';
import styles from './DashboardPage.module.css';

/** Los tres estados oficiales, en el orden en que se presentan. */
const ESTADOS: readonly EstadoDePublicacion[] = ['draft', 'published', 'archived'];

/** Nombre visible y ruta del panel para cada recurso del contrato. */
const PRESENTACION: Readonly<
  Record<string, { readonly nombre: string; readonly ruta: SeccionDeContenidoAdmin }>
> = {
  posts: { nombre: 'Artículos', ruta: RUTAS_ADMIN.articulos },
  'book-reviews': { nombre: 'Reviews', ruta: RUTAS_ADMIN.reviews },
  videos: { nombre: 'Videos', ruta: RUTAS_ADMIN.videos },
  projects: { nombre: 'Proyectos', ruta: RUTAS_ADMIN.proyectos },
};

interface ConteoDeRecurso {
  readonly ruta: string;
  readonly nombre: string;
  readonly porEstado: Readonly<Record<EstadoDePublicacion, number>>;
}

interface Reciente {
  readonly id: string;
  readonly title: string;
  readonly updated_at: string;
  readonly status: EstadoDePublicacion;
  readonly ruta: SeccionDeContenidoAdmin;
}

/** Elemento minimo que el bloque de recientes necesita de cualquier tipo. */
interface ElementoReciente {
  readonly id: string;
  readonly title: string;
  readonly updated_at: string;
  readonly status: EstadoDePublicacion;
}

export function DashboardPage() {
  useDocumentTitle('Panel administrativo');
  const cliente = useHttpClient();

  /* --- Bloque 1: 12 peticiones de conteo --------------------------------- */
  const cargarConteos = useCallback(
    async (signal: AbortSignal): Promise<readonly ConteoDeRecurso[]> => {
      const peticiones = RECURSOS_PUBLICABLES.flatMap((recurso) =>
        ESTADOS.map(async (estado) => {
          const pagina = await listar(
            cliente,
            recurso as RecursoDeContenido<ElementoReciente, unknown>,
            { status: estado, pageSize: 1 },
            signal,
          );
          return { ruta: recurso.ruta, estado, total: pagina.total };
        }),
      );

      const resultados = await Promise.all(peticiones);

      return RECURSOS_PUBLICABLES.map((recurso) => ({
        ruta: recurso.ruta,
        nombre: PRESENTACION[recurso.ruta]?.nombre ?? recurso.ruta,
        porEstado: Object.fromEntries(
          ESTADOS.map((estado) => [
            estado,
            resultados.find((r) => r.ruta === recurso.ruta && r.estado === estado)?.total ?? 0,
          ]),
        ) as Record<EstadoDePublicacion, number>,
      }));
    },
    [cliente],
  );

  /* --- Bloque 2: 4 peticiones de ultimos modificados --------------------- */
  const cargarRecientes = useCallback(
    async (signal: AbortSignal): Promise<readonly Reciente[]> => {
      const paginas = await Promise.all(
        RECURSOS_PUBLICABLES.map(async (recurso) => {
          const pagina = await listar(
            cliente,
            recurso as RecursoDeContenido<ElementoReciente, unknown>,
            { pageSize: 5 },
            signal,
          );
          const ruta = PRESENTACION[recurso.ruta]?.ruta ?? RUTAS_ADMIN.articulos;
          return pagina.items.map((item) => ({
            id: item.id,
            title: item.title,
            updated_at: item.updated_at,
            status: item.status,
            ruta,
          }));
        }),
      );

      /*
       * Quedarse con los cinco mayores de la union de cuatro «top 5» **es
       * exacto**: cualquier elemento del top 5 global esta en el top 5 de su
       * propio tipo, porque cada lista viene ya ordenada por `updated_at`.
       */
      return paginas
        .flat()
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 5);
    },
    [cliente],
  );

  /* --- Bloque 3: 1 peticion de auditoria --------------------------------- */
  const cargarAuditoria = useCallback(
    async (signal: AbortSignal): Promise<readonly EventoDeAuditoria[]> => {
      const pagina = await listarEventosDeAuditoria(cliente, { pageSize: 5 }, signal);
      // No se reordena: llega `occurred_at` desc con desempate `id` asc.
      return pagina.items;
    },
    [cliente],
  );

  const conteos = useCargaAdmin(cargarConteos);
  const recientes = useCargaAdmin(cargarRecientes);
  const auditoria = useCargaAdmin(cargarAuditoria);

  return (
    <Stack gap="xl">
      <h1>Panel administrativo</h1>

      <section aria-labelledby="conteos">
        <Stack gap="md">
          <h2 id="conteos">Contenido por tipo y estado</h2>
          {conteos.estado.fase === 'cargando' ? <LoadingState /> : null}
          {conteos.estado.fase === 'error' || conteos.estado.fase === 'no-encontrado' ? (
            <ErrorState onRetry={conteos.reintentar} />
          ) : null}
          {conteos.estado.fase === 'exito' ? (
            <div className={styles['rejilla']}>
              {conteos.estado.datos.map((conteo) => (
                <Card key={conteo.ruta}>
                  <Stack gap="xs">
                    <h3>{conteo.nombre}</h3>
                    <ul className={styles['conteos']}>
                      {ESTADOS.map((estado) => (
                        <li key={estado}>
                          <EstadoBadge estado={estado} /> {conteo.porEstado[estado]}
                        </li>
                      ))}
                    </ul>
                  </Stack>
                </Card>
              ))}
            </div>
          ) : null}
        </Stack>
      </section>

      <section aria-labelledby="recientes">
        <Stack gap="md">
          <h2 id="recientes">Últimos elementos modificados</h2>
          {recientes.estado.fase === 'cargando' ? <LoadingState /> : null}
          {recientes.estado.fase === 'error' || recientes.estado.fase === 'no-encontrado' ? (
            <ErrorState onRetry={recientes.reintentar} />
          ) : null}
          {recientes.estado.fase === 'exito' ? (
            recientes.estado.datos.length === 0 ? (
              <EmptyState mensaje="Todavía no hay contenido creado." />
            ) : (
              <ul className={styles['lista']}>
                {recientes.estado.datos.map((elemento) => (
                  <li key={`${elemento.ruta}-${elemento.id}`}>
                    <Link to={rutaDeEdicion(elemento.ruta, elemento.id)}>{elemento.title}</Link>{' '}
                    <EstadoBadge estado={elemento.status} />{' '}
                    <span className={styles['fecha']}>
                      {formatearFechaLarga(elemento.updated_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </Stack>
      </section>

      <section aria-labelledby="auditoria">
        <Stack gap="md">
          <h2 id="auditoria">Últimos eventos de auditoría</h2>
          {auditoria.estado.fase === 'cargando' ? <LoadingState /> : null}
          {auditoria.estado.fase === 'error' || auditoria.estado.fase === 'no-encontrado' ? (
            <ErrorState onRetry={auditoria.reintentar} />
          ) : null}
          {auditoria.estado.fase === 'exito' ? (
            auditoria.estado.datos.length === 0 ? (
              <EmptyState mensaje="Todavía no hay acciones registradas." />
            ) : (
              <ul className={styles['lista']}>
                {auditoria.estado.datos.map((evento) => (
                  <li key={evento.id}>
                    <span className={styles['fecha']}>
                      {formatearFechaLarga(evento.occurred_at)}
                    </span>{' '}
                    <Badge tone="neutral">{evento.action}</Badge> <span>{evento.entity_type}</span>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </Stack>
      </section>

      <section aria-labelledby="accesos">
        <Stack gap="sm">
          <h2 id="accesos">Accesos rápidos</h2>
          <Stack direction="horizontal" gap="md" wrap>
            {SECCIONES_ADMIN.filter((seccion) => seccion.ruta !== RUTAS_ADMIN.panel).map(
              (seccion) => (
                <Link key={seccion.ruta} to={seccion.ruta}>
                  {seccion.nombre}
                </Link>
              ),
            )}
          </Stack>
        </Stack>
      </section>
    </Stack>
  );
}
