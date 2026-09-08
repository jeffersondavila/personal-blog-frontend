/** Politica del servidor HTTP local (S-05). No cambia el pipeline Markdown. */
export function cabecerasDelSitio(env: Record<string, string>): string {
  function origen(nombre: string): URL {
    try {
      const valor = env[nombre] ?? '';
      const url = new URL(valor);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/' ||
        !/^[a-z\d.:[\]-]+$/i.test(url.hostname) ||
        valor.trim().replace(/\/$/, '') !== url.origin
      )
        throw new Error();
      return url;
    } catch {
      throw new Error(`${nombre} debe ser un origen HTTP(S) canonico sin credenciales.`);
    }
  }
  const api = origen('VITE_API_BASE_URL');
  const sitio = origen('VITE_SITE_BASE_URL');
  if (sitio.protocol === 'https:' && api.protocol !== 'https:') {
    throw new Error('Un sitio HTTPS requiere un API HTTPS.');
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    `connect-src 'self' ${api.origin}`,
    "img-src 'self' http: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
    ...(sitio.protocol === 'https:' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  return [
    `add_header Content-Security-Policy "${csp}" always;`,
    'add_header X-Content-Type-Options "nosniff" always;',
    'add_header X-Frame-Options "DENY" always;',
    'add_header Referrer-Policy "no-referrer" always;',
    'add_header Permissions-Policy \'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self "https://www.youtube-nocookie.com" "https://player.vimeo.com"), autoplay=(self "https://www.youtube-nocookie.com" "https://player.vimeo.com"), picture-in-picture=(self "https://www.youtube-nocookie.com" "https://player.vimeo.com")\' always;',
    'add_header X-Robots-Tag $security_robots always;',
    'add_header Cache-Control $security_cache always;',
    '',
  ].join('\n');
}
