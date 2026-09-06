/**
 * Dashboard: las tres piezas del alcance minimo y **exactamente 17 peticiones**.
 *
 * El recuento se comprueba de verdad, no de pasada: si alguien volviera a
 * escribir 16 —o dejara de pedir la auditoria— estas pruebas se ponen rojas.
 */
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { conSesion, renderPanel } from '../../test/renderPanel';
import { pagina, respuestaDeError, respuestaJson, rutasPedidas } from '../../test/respuestas';
import type { Manejador } from '../../test/respuestas';

const RECURSOS = ['posts', 'book-reviews', 'videos', 'projects'] as const;

function elemento(id: string, title: string, updated: string) {
  return {
    id,
    slug: id,
    title,
    summary: null,
    status: 'draft',
    published_at: null,
    featured: false,
    seo_title: null,
    seo_description: null,
    tags: [],
    created_at: updated,
    updated_at: updated,
  };
}

function evento(id: string, action: string, entityId: string | null) {
  return {
    id,
    occurred_at: '2026-09-05T10:00:00Z',
    action,
    entity_type: 'post',
    entity_id: entityId,
  };
}

/** Manejadores que devuelven contenido en los cuatro tipos y en auditoria. */
function conDatos() {
  const manejadores: Record<string, Manejador> = { ...conSesion() };
  for (const recurso of RECURSOS) {
    manejadores[`/api/v1/admin/${recurso}`] = () =>
      respuestaJson(
        pagina([elemento(`${recurso}-1`, `Elemento de ${recurso}`, '2026-09-01T00:00:00Z')], {
          total: 3,
        }),
      );
  }
  manejadores['/api/v1/admin/audit-events'] = () =>
    respuestaJson(pagina([evento('e1', 'content.published', 'abc')]));
  return manejadores;
}

describe('dashboard — recuento de peticiones', () => {
  it('hace exactamente 17 peticiones: 12 conteos + 4 listados + 1 auditoría', async () => {
    const { fetchFn } = renderPanel('/admin', conDatos());

    await screen.findByRole('heading', { level: 2, name: 'Últimos eventos de auditoría' });

    await waitFor(() => {
      const rutas = rutasPedidas(fetchFn).filter((ruta) => ruta !== '/api/v1/admin/auth/me');

      const conteos = rutas.filter(
        (ruta) => ruta.includes('status=') && ruta.includes('page_size=1'),
      );
      const recientes = rutas.filter(
        (ruta) =>
          !ruta.includes('status=') &&
          ruta.includes('page_size=5') &&
          !ruta.includes('audit-events'),
      );
      const auditoria = rutas.filter((ruta) => ruta.includes('audit-events'));

      expect(conteos).toHaveLength(12);
      expect(recientes).toHaveLength(4);
      expect(auditoria).toHaveLength(1);
      expect(conteos.length + recientes.length + auditoria.length).toBe(17);
    });
  });

  it('pide los tres estados de cada uno de los cuatro tipos', async () => {
    const { fetchFn } = renderPanel('/admin', conDatos());

    await screen.findByRole('heading', { level: 2, name: 'Últimos eventos de auditoría' });

    await waitFor(() => {
      const rutas = rutasPedidas(fetchFn);
      for (const recurso of RECURSOS) {
        for (const estado of ['draft', 'published', 'archived']) {
          expect(
            rutas.some(
              (ruta) =>
                ruta.startsWith(`/api/v1/admin/${recurso}?`) && ruta.includes(`status=${estado}`),
            ),
          ).toBe(true);
        }
      }
    });
  });

  it('no envía ningún parámetro que el contrato no admita', async () => {
    const { fetchFn } = renderPanel('/admin', conDatos());

    await screen.findByRole('heading', { level: 2, name: 'Últimos eventos de auditoría' });

    await waitFor(() => {
      for (const ruta of rutasPedidas(fetchFn)) {
        const consulta = new URLSearchParams(ruta.split('?')[1] ?? '');
        for (const clave of consulta.keys()) {
          expect(['page', 'page_size', 'status']).toContain(clave);
        }
      }
    });
  });
});

describe('dashboard — las tres piezas de MVP_SCOPE 3.3', () => {
  it('muestra el conteo por tipo y estado', async () => {
    renderPanel('/admin', conDatos());

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Contenido por tipo y estado' }),
    ).toBeVisible();
    expect(await screen.findByRole('heading', { level: 3, name: 'Artículos' })).toBeVisible();
  });

  it('muestra los últimos elementos modificados', async () => {
    renderPanel('/admin', conDatos());

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Últimos elementos modificados' }),
    ).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Elemento de posts' })).toBeVisible();
  });

  it('muestra los últimos eventos de auditoría', async () => {
    renderPanel('/admin', conDatos());

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Últimos eventos de auditoría' }),
    ).toBeVisible();
    expect(await screen.findByText('content.published')).toBeVisible();
  });
});

describe('dashboard — estados por bloque', () => {
  it('un bloque que falla no impide renderizar los otros dos', async () => {
    const manejadores = conDatos();
    manejadores['/api/v1/admin/audit-events'] = () =>
      respuestaDeError('internal_error', 500, 'Fallo.');

    renderPanel('/admin', manejadores);

    // El bloque de auditoria muestra su propio error…
    expect(await screen.findByRole('alert')).toBeVisible();
    // …y los otros dos siguen ahi.
    expect(await screen.findByRole('heading', { level: 3, name: 'Artículos' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Elemento de posts' })).toBeVisible();
  });

  it('un historial vacío se anuncia como vacío, no como error', async () => {
    const manejadores = conDatos();
    manejadores['/api/v1/admin/audit-events'] = () => respuestaJson(pagina([]));

    renderPanel('/admin', manejadores);

    expect(await screen.findByText('Todavía no hay acciones registradas.')).toBeVisible();
  });

  it('un evento sin elemento asociado se renderiza igual', async () => {
    const manejadores = conDatos();
    manejadores['/api/v1/admin/audit-events'] = () =>
      respuestaJson(pagina([evento('e2', 'authentication.login_succeeded', null)]));

    renderPanel('/admin', manejadores);

    expect(await screen.findByText('authentication.login_succeeded')).toBeVisible();
  });
});
