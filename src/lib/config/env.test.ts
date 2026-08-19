/**
 * Contrato de la configuracion de entorno del frontend (requisito T-01:
 * configuracion por variables de entorno, **validada al arrancar**).
 *
 * Estas pruebas no leen `import.meta.env`: le pasan a `readAppConfig` un objeto
 * fabricado. Asi el resultado no depende del `.env` personal de quien ejecute
 * la suite ni de la maquina (`Task/005.6` cerro exactamente ese defecto en el
 * backend).
 */
import { describe, expect, it } from 'vitest';

import { readAppConfig } from './env';

describe('readAppConfig', () => {
  it('acepta un origen http valido y lo devuelve normalizado sin barra final', () => {
    const config = readAppConfig({ VITE_API_BASE_URL: 'http://localhost:8000' });

    expect(config).toStrictEqual({ apiBaseUrl: 'http://localhost:8000' });
  });

  it('acepta https y conserva el prefijo de ruta que traiga el origen', () => {
    const config = readAppConfig({ VITE_API_BASE_URL: 'https://api.ejemplo.test/backend/' });

    expect(config.apiBaseUrl).toBe('https://api.ejemplo.test/backend');
  });

  it('ignora los espacios alrededor del valor', () => {
    const config = readAppConfig({ VITE_API_BASE_URL: '  http://localhost:8000  ' });

    expect(config.apiBaseUrl).toBe('http://localhost:8000');
  });

  it('falla cuando la variable no esta definida', () => {
    expect(() => readAppConfig({})).toThrow(/VITE_API_BASE_URL/);
  });

  it('falla cuando la variable esta vacia', () => {
    expect(() => readAppConfig({ VITE_API_BASE_URL: '   ' })).toThrow(/VITE_API_BASE_URL/);
  });

  it('falla cuando el valor no es una URL absoluta', () => {
    expect(() => readAppConfig({ VITE_API_BASE_URL: '/api' })).toThrow(/VITE_API_BASE_URL/);
  });

  it('falla cuando el esquema no es http ni https', () => {
    expect(() => readAppConfig({ VITE_API_BASE_URL: 'ftp://ejemplo.test' })).toThrow(
      /VITE_API_BASE_URL/,
    );
  });

  it('el mensaje de error nombra la variable y no revela el valor recibido', () => {
    const valorInvalido = 'no-es-una-url';

    expect(() => readAppConfig({ VITE_API_BASE_URL: valorInvalido })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining(valorInvalido) as unknown as string,
      }),
    );
  });
});
