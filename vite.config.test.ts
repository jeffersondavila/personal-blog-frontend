// @vitest-environment node
import { fileURLToPath } from 'node:url';

import { createLogger, loadConfigFromFile } from 'vite';
import { expect, it, vi } from 'vitest';

it('carga la configuracion real sin incompatibilidades con el futuro loader nativo', async () => {
  // Ejercita el analizador real de Vite. No se silencia la advertencia: se exige
  // que no se produzca, tambien cuando reaparezca un import sin extension.
  vi.stubEnv('VITE_CONFIG_NATIVE_IGNORE_WARNING', '');
  const logger = createLogger();
  const advertir = vi.spyOn(logger, 'warn');
  const resultado = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    undefined,
    'warn',
    logger,
  );

  expect(resultado?.config.build?.outDir).toBe('dist');
  expect(advertir).not.toHaveBeenCalled();
});
