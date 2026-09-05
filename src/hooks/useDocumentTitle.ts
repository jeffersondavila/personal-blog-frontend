/**
 * Titulo del documento por pagina.
 *
 * Es la propiedad **basica** de accesibilidad de WCAG 2.4.2 —cada pagina se
 * identifica por su titulo, que es lo primero que anuncia un lector de
 * pantalla al navegar—. **No** es el SEO de `Task/016`: `description`, Open
 * Graph y canonical no se tocan aqui.
 *
 * El sufijo es el nombre estatico del sitio, el mismo de `index.html`: el
 * nombre del autor llega por el API y un titulo no puede esperar a una
 * peticion.
 *
 * `undefined` significa **delegar**: la pagina no fija titulo porque otro
 * componente que ella monta lo hace —una pagina de detalle que renderiza la
 * 404 cuando el API responde `404`—. Con `null` se usa solo el nombre del
 * sitio.
 */
import { useEffect } from 'react';

import { NOMBRE_DEL_SITIO } from '../lib/site';

export function tituloDelDocumento(titulo: string | null): string {
  return titulo === null || titulo.trim() === ''
    ? NOMBRE_DEL_SITIO
    : `${titulo.trim()} · ${NOMBRE_DEL_SITIO}`;
}

export function useDocumentTitle(titulo: string | null | undefined): void {
  useEffect(() => {
    if (titulo === undefined) {
      return undefined;
    }
    const anterior = document.title;
    document.title = tituloDelDocumento(titulo);

    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
