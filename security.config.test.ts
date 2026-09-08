import { describe, expect, it } from 'vitest';
import { cabecerasDelSitio } from './security.config';

const entorno = {
  VITE_API_BASE_URL: 'http://localhost:8081',
  VITE_SITE_BASE_URL: 'http://localhost:8081',
};

describe('politica HTTP del sitio', () => {
  it('permite recursos y embeds aprobados sin abrir scripts ni estilos', () => {
    const contenido = cabecerasDelSitio(entorno);
    expect(contenido).toContain("script-src 'self'");
    expect(contenido).toContain("style-src 'self'");
    expect(contenido).toContain("connect-src 'self' http://localhost:8081");
    expect(contenido).toContain("img-src 'self' http: https:");
    expect(contenido).toContain(
      'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
    );
    expect(contenido).not.toMatch(/unsafe-inline|unsafe-eval|Strict-Transport-Security|data:/);
  });
  it('utiliza el API configurado de D-15 sin elegir un dominio productivo', () => {
    const contenido = cabecerasDelSitio({
      VITE_API_BASE_URL: 'https://api.example.test',
      VITE_SITE_BASE_URL: 'https://example.test',
    });
    expect(contenido).toContain("connect-src 'self' https://api.example.test");
    expect(contenido).toContain('upgrade-insecure-requests');
  });
  it.each([
    '',
    '*',
    // Unico caso que hace exigible el filtro de esquema: el resto de la
    // validacion —credenciales, ruta, query, host— lo aceptaria.
    'ftp://site.test',
    'https://*.test',
    'https://user:canary018@site.test',
    'https://site.test/path',
    'https://site.test?x=canary018',
    'http://site.test:99999',
    'https://site.test\\evil',
    'https://site.test\nX-Evil: canary018',
  ])('rechaza configuracion no canonica sin repetir valores: %j', (valor) => {
    expect(() => cabecerasDelSitio({ ...entorno, VITE_API_BASE_URL: valor })).toThrow(
      'VITE_API_BASE_URL debe ser un origen HTTP(S) canonico sin credenciales.',
    );
  });
  it('rechaza contenido mixto de API al servir el sitio por HTTPS', () => {
    expect(() =>
      cabecerasDelSitio({ ...entorno, VITE_SITE_BASE_URL: 'https://site.test' }),
    ).toThrow('Un sitio HTTPS requiere un API HTTPS.');
  });
});
