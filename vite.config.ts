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
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
