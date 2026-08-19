/**
 * Configuracion de ESLint (flat config) para `personal-blog-frontend`.
 *
 * Reparto de responsabilidades, para no tener dos herramientas peleando por lo
 * mismo (`CONTRIBUTING.md`, seccion 5):
 *
 * - **ESLint** juzga *correccion*: reglas de React, de los hooks y del sistema
 *   de tipos.
 * - **Prettier** juzga *formato*. `eslint-config-prettier` desactiva en ESLint
 *   toda regla que opine sobre formato, de modo que nunca hay dos veredictos
 *   contradictorios sobre el mismo archivo.
 *
 * Se usa `defineConfig` de ESLint y no `tseslint.config`: este ultimo esta
 * marcado como obsoleto desde que ESLint incorporo la misma funcionalidad.
 */
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // `dist/` y `coverage/` son artefactos generados: no se analizan.
  globalIgnores(['dist/**', 'coverage/**']),

  // --- Codigo de aplicacion y pruebas (navegador) --------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // El proyecto no acepta `any` mientras exista una alternativa razonable.
      // `unknown` mas un estrechamiento explicito es esa alternativa.
      '@typescript-eslint/no-explicit-any': 'error',
      // Silenciar un error de tipos exige justificarlo por escrito.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true },
      ],
      // `console` no es un canal de observabilidad: la observabilidad real es
      // `Task/018`. Se permiten unicamente avisos y errores.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // --- Archivos de configuracion del proyecto (Node) -----------------------
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Debe ir el ultimo: desactiva las reglas de formato de todo lo anterior.
  prettierConfig,
]);
