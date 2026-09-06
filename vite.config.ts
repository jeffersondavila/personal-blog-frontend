/**
 * Configuracion de Vite para `personal-blog-frontend`.
 *
 * El build es estatico y estandar: no depende del sistema de archivos de la
 * maquina que lo genera ni de ningun proveedor de hosting concreto. Esa
 * independencia es el requisito T-05 de
 * `personal-blog-infra/docs/architecture/non-functional-requirements.md`, y es
 * lo que permite servir el mismo `dist/` detras del reverse proxy local
 * (`Task/007`) y publicarlo mas adelante en Cloudflare Pages (`Task/034`).
 */
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

import { construirRobotsTxt } from './robots.config';

/**
 * Emite `robots.txt` en el build (`Task/016`, requisito E-06).
 *
 * No puede vivir en `public/`: la linea `Sitemap:` necesita una URL absoluta, y
 * el origen es configuracion —local hoy, y lo que fijen `Task/034` y `Task/035`
 * cuando **D-07** se resuelva—. `public/` se copia tal cual y no admite valores
 * dependientes del entorno.
 *
 * Tambien se sirve en `npm run dev`, para que el desarrollo y el artefacto no
 * difieran: sin esto, `/robots.txt` en desarrollo caeria en el *fallback* de la
 * SPA y devolveria HTML, que es justo el defecto que esta tarea corrige.
 *
 * El contenido lo decide `construirRobotsTxt`, que esta probada aparte. Aqui
 * solo se conecta al ciclo de vida de Vite.
 */
function robotsTxt(): Plugin {
  const NOMBRE = 'robots.txt';
  const contenidoDe = (env: Record<string, string>) =>
    construirRobotsTxt({ apiBaseUrl: env['VITE_API_BASE_URL'] });

  let contenido = '';

  return {
    name: 'personal-blog:robots-txt',
    configResolved(config) {
      contenido = contenidoDe(config.env as Record<string, string>);
    },
    configureServer(servidor) {
      servidor.middlewares.use((peticion, respuesta, siguiente) => {
        if (peticion.url !== `/${NOMBRE}`) {
          siguiente();
          return;
        }
        respuesta.setHeader('Content-Type', 'text/plain; charset=utf-8');
        respuesta.end(contenido);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: NOMBRE, source: contenido });
    },
  };
}

export default defineConfig({
  plugins: [react(), robotsTxt()],
  build: {
    // Rutas relativas al directorio del proyecto: `dist/` no debe contener
    // ninguna ruta absoluta de la maquina que construyo el artefacto.
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Aislamiento: ningun test hereda estado de otro (mocks, temporizadores,
    // modulos). Ver `CONTRIBUTING.md`, seccion 5.
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Punto de entrada: solo compone y monta. Su comportamiento se cubre
        // a traves de `App`, del router y de la configuracion.
        'src/main.tsx',
        // Declaraciones de tipos: no generan codigo ejecutable.
        'src/**/*.d.ts',
        'src/test/**',
      ],
    },
  },
});
