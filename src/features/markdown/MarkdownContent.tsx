/**
 * Contenido Markdown de una pagina, con el renderizador cargado en diferido.
 *
 * ADR-005 anticipa el coste del render en cliente y pide *«carga diferida del
 * renderizador donde aplique»*: los listados, Inicio, Contacto y la busqueda no
 * necesitan `react-markdown`, asi que no lo descargan. Solo las cuatro
 * superficies con Markdown —detalle de articulo, review, proyecto y Quien
 * soy— lo traen, y lo hacen en un *chunk* aparte.
 *
 * Es el componente que `Task/015` debe reutilizar para la vista previa: el
 * pipeline —y por tanto la sanitizacion— es exactamente el mismo.
 */
import { lazy, Suspense } from 'react';

import { LoadingState } from '../../components';

const Renderizador = lazy(() => import('./MarkdownRenderer'));

export interface MarkdownContentProps {
  readonly markdown: string;
}

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  return (
    <Suspense fallback={<LoadingState>Cargando contenido…</LoadingState>}>
      <Renderizador markdown={markdown} />
    </Suspense>
  );
}
