/**
 * Analisis del artefacto real de Vite para el requisito **P-05**.
 *
 * El requisito no es que el codigo del panel **no exista** en `dist/` —tiene que
 * existir, en *chunks* diferidos—, sino que **no pertenezca al grafo de carga
 * inicial** de una pagina publica. Buscar una cadena en todos los assets no
 * comprueba eso: comprueba lo contrario.
 *
 * Lo que se hace aqui es lo unico que responde a la pregunta: partir de los
 * scripts que `dist/index.html` referencia y seguir **solo los `import`
 * estaticos**, de forma transitiva. Lo que queda es lo que el navegador descarga
 * antes de que nadie navegue a ninguna parte.
 *
 * Sin dependencias nuevas y sin tocar `vite.config.ts`: no se habilita
 * `build.manifest` ni ningun plugin para facilitar la medicion, porque cambiar
 * la configuracion del build para poder medirlo mediria otro build.
 */
import { readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

/**
 * Distingue un `import` estatico de uno dinamico.
 *
 * `import("…")` y `import(/* … *\/ "…")` llevan parentesis; `import "…"`,
 * `from "…"` y `export … from "…"` no. Solo los segundos entran en el grafo
 * inicial.
 */
const IMPORT_ESTATICO = /(?:^|[\s;}])(?:import|export)\s*(?:[^'"()]*?\sfrom\s*)?["']([^"']+)["']/g;

/** Scripts que `index.html` carga o precarga: la raiz del grafo. */
export function raicesDelHtml(dist: string): string[] {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const raices = new Set<string>();

  for (const patron of [
    /<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/g,
    /<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+)["']/g,
  ]) {
    for (const coincidencia of html.matchAll(patron)) {
      const ruta = coincidencia[1];
      if (ruta !== undefined) {
        raices.add(resolve(dist, ruta.replace(/^\//, '')));
      }
    }
  }

  return [...raices];
}

/**
 * Clausura transitiva de los `import` **estaticos** desde las raices.
 *
 * Devuelve rutas absolutas de los archivos que el navegador descarga sin que el
 * usuario navegue a ninguna parte.
 */
export function clausuraEstatica(dist: string): Set<string> {
  const pendientes = raicesDelHtml(dist);
  const vistos = new Set<string>();

  while (pendientes.length > 0) {
    const archivo = pendientes.pop();
    if (archivo === undefined || vistos.has(archivo)) {
      continue;
    }
    vistos.add(archivo);

    let contenido: string;
    try {
      contenido = readFileSync(archivo, 'utf8');
    } catch {
      continue; // Un asset que no es JavaScript no aporta imports.
    }

    for (const coincidencia of contenido.matchAll(IMPORT_ESTATICO)) {
      const especificador = coincidencia[1];
      if (!especificador?.startsWith('.')) {
        continue; // Un import externo no vive en `dist/`.
      }
      pendientes.push(resolve(dirname(archivo), especificador));
    }
  }

  return vistos;
}

/** Nombres de archivo de la clausura, para leerlos en un mensaje de fallo. */
export function nombresDe(rutas: Iterable<string>): string[] {
  return [...rutas].map((ruta) => basename(ruta)).sort();
}
