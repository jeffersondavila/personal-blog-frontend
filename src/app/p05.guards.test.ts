/**
 * Gate del requisito **P-05**: *«sin descargar contenido administrativo en
 * páginas públicas: el código del panel se carga solo en el panel»*.
 *
 * Se comprueba sobre el **artefacto real** de `dist/`, no sobre el codigo
 * fuente. Cinco comprobaciones, y las tres primeras viven aqui:
 *
 * | # | Qué demuestra |
 * | --- | --- |
 * | **P-05-1** | Existe un *chunk* administrativo separado del de entrada |
 * | **P-05-2** | El grafo de carga inicial **no** contiene el panel |
 * | **P-05-3** | Anti-tautología: los marcadores **sí** existen en `dist/` |
 *
 * P-05-4 —una visita pública no pide nada del panel— vive en
 * `rutasDelPanel.test.tsx`, donde hay un router de verdad. P-05-5 —la
 * demostración fuera de producción— es la guarda heredada de `Task/014`.
 *
 * **Por qué P-05-3 no es decorativa.** Sin ella, P-05-2 pasaria tambien si el
 * panel no se hubiera construido en absoluto: una ausencia total satisface
 * «no esta en el grafo inicial» de la peor manera posible.
 *
 * La suite se salta estas pruebas si no hay `dist/`: exigir un build para correr
 * los tests unitarios haria lenta toda la suite. El reporte de la tarea registra
 * la ejecucion con `dist/` presente.
 */
/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { describe, expect, it } from 'vitest';

import { clausuraEstatica, nombresDe } from '../test/grafoDeCarga';

const DIST = join(cwd(), 'dist');
const ASSETS = join(DIST, 'assets');

/**
 * Cadenas que solo puede contener el codigo del panel.
 *
 * Tienen que ser **literales que sobrevivan al build**. `/admin/acceso` no lo
 * es: `rutasAdmin.ts` lo compone con una plantilla, asi que en el bundle no
 * existe esa cadena sino la concatenacion que la produce. Se usan tres que si
 * son literales: el prefijo del contrato administrativo, la ruta del historial
 * que anadio `Task/012.1` y el encabezado de la pagina de acceso.
 */
const MARCADORES = ['/api/v1/admin', '/audit-events', 'Acceso al panel'] as const;

const hayBuild = existsSync(DIST) && existsSync(ASSETS);

/** Todos los JavaScript emitidos. */
function assets(): string[] {
  return readdirSync(ASSETS)
    .filter((nombre) => nombre.endsWith('.js'))
    .map((nombre) => join(ASSETS, nombre));
}

function contiene(archivo: string, marcador: string): boolean {
  return readFileSync(archivo, 'utf8').includes(marcador);
}

describe.skipIf(!hayBuild)('P-05 — el panel no viaja en la carga inicial', () => {
  it('P-05-3 (anti-tautología): los marcadores administrativos SÍ están en `dist/`', () => {
    for (const marcador of MARCADORES) {
      const conElMarcador = assets().filter((archivo) => contiene(archivo, marcador));

      expect(
        conElMarcador.length,
        `Ningún asset contiene «${marcador}»: P-05-2 pasaría por ausencia, no por separación.`,
      ).toBeGreaterThan(0);
    }
  });

  it('P-05-2: la clausura de imports estáticos no contiene ningún marcador', () => {
    const inicial = clausuraEstatica(DIST);

    for (const marcador of MARCADORES) {
      const culpables = [...inicial].filter(
        (archivo) => archivo.endsWith('.js') && contiene(archivo, marcador),
      );

      expect(
        nombresDe(culpables),
        `«${marcador}» aparece en el grafo de carga inicial del sitio público.`,
      ).toEqual([]);
    }
  });

  it('P-05-1: el chunk administrativo existe y está fuera de ese grafo', () => {
    const inicial = clausuraEstatica(DIST);
    const administrativos = assets().filter((archivo) =>
      MARCADORES.every((marcador) => contiene(archivo, marcador)),
    );

    expect(administrativos.length).toBeGreaterThan(0);
    for (const archivo of administrativos) {
      expect(inicial.has(archivo)).toBe(false);
    }
  });

  it('P-05-5: la demostración del sistema de diseño no llega a producción', () => {
    const conLaRuta = assets().filter((archivo) => contiene(archivo, '__design-system'));

    expect(nombresDe(conLaRuta)).toEqual([]);
  });
});
