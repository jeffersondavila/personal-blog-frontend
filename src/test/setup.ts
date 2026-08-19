/**
 * Preparacion comun de la suite de pruebas.
 *
 * Dos responsabilidades, ambas necesarias:
 *
 * 1. Anadir los *matchers* de `@testing-library/jest-dom` (`toBeInTheDocument`,
 *    `toHaveAttribute`, ...) a `expect`.
 * 2. **Desmontar lo renderizado despues de cada prueba.** Testing Library
 *    registra esa limpieza por su cuenta solo cuando el entorno expone las
 *    APIs globales de pruebas; la suite corre con `globals: false`
 *    —cada archivo importa de `vitest` lo que usa, sin globales implicitos—,
 *    asi que hay que declararla aqui. Sin ella, el DOM de una prueba sobrevive
 *    a la siguiente y una consulta encuentra elementos duplicados: un fallo que
 *    depende del orden de ejecucion, justo lo que la suite no debe tener.
 *
 * La limpieza de mocks, globales y variables de entorno simuladas la configura
 * `vite.config.ts` (`clearMocks`, `mockReset`, `restoreMocks`, `unstubGlobals`,
 * `unstubEnvs`).
 */
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
