/**
 * Superficie publica del sistema de diseno.
 *
 * Es el unico punto de entrada previsto para el sitio publico (`Task/014`) y
 * el panel administrativo (`Task/015`):
 *
 * ```ts
 * import { Button, Card, Container, Pagination, Stack } from '../components';
 * ```
 *
 * Importar un archivo interno —`components/Button/Button`— funciona, pero no
 * es el contrato: lo que este archivo exporta es lo que el sistema se
 * compromete a mantener. Los CSS Modules refuerzan esa frontera por su cuenta,
 * porque sus nombres de clase se generan en el build y ninguna pagina puede
 * depender de ellos.
 *
 * Las cinco primitivas son de `Task/013`. `Task/014` anade cinco componentes
 * compartidos, cada uno con al menos dos consumidores reales en el sitio
 * publico: `Pagination`, `ExternalLink`, `LoadingState`, `EmptyState` y
 * `ErrorState`. Ninguno conoce el dominio ni llama al API
 * (`software-architecture.md`, seccion 4.3).
 *
 * Los tokens NO se exportan desde aqui. Viven en `src/styles/tokens.css`, los
 * carga `global.css` una sola vez y se consumen como `var(--color-...)` desde
 * cualquier hoja de estilos. No existe —ni hace falta— un objeto de tokens en
 * JavaScript.
 */

export { Badge } from './Badge/Badge';
export type { BadgeProps, BadgeTone } from './Badge/Badge';

export { Button } from './Button/Button';
export type { ButtonProps, ButtonVariant } from './Button/Button';

export { Card } from './Card/Card';
export type { CardProps } from './Card/Card';

export { Container } from './Container/Container';
export type { ContainerProps, ContainerWidth } from './Container/Container';

export { Stack } from './Stack/Stack';
export type { StackAlign, StackDirection, StackGap, StackProps } from './Stack/Stack';

export { EmptyState } from './EmptyState/EmptyState';
export type { EmptyStateProps } from './EmptyState/EmptyState';

export { ErrorState } from './ErrorState/ErrorState';
export type { ErrorStateProps } from './ErrorState/ErrorState';

export { ExternalLink } from './ExternalLink/ExternalLink';
export type { ExternalLinkProps } from './ExternalLink/ExternalLink';

export { LoadingState } from './LoadingState/LoadingState';
export type { LoadingStateProps } from './LoadingState/LoadingState';

export { Pagination } from './Pagination/Pagination';
export type { PaginationProps } from './Pagination/Pagination';
