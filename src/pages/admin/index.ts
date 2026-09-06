/**
 * Superficie del panel administrativo, en **un solo modulo**.
 *
 * Es lo que hace posible el requisito **P-05**: las dieciocho rutas de
 * `routes.tsx` llegan aqui por `import()` dinamico, y como todas importan **este
 * mismo modulo**, Vite emite **un unico chunk administrativo** que ninguna
 * pagina publica arrastra.
 *
 * Por eso `routes.tsx` no puede importar nada de aqui de forma estatica: seria
 * exactamente lo que P-05 prohibe, y la prueba del gate se pondria roja.
 */
export { AdminLayout } from '../../app/AdminLayout';
export { RutaProtegida } from '../../app/RutaProtegida';

export { LoginPage } from './LoginPage';
export { DashboardPage } from './DashboardPage';
export { AdminNotFoundPage } from './AdminNotFoundPage';
export {
  BookReviewFormPage,
  BookReviewsAdminPage,
  PostFormPage,
  PostsAdminPage,
  ProjectFormPage,
  ProjectsAdminPage,
  VideoFormPage,
  VideosAdminPage,
} from './contenido';
export { TagsAdminPage } from './TagsAdminPage';
export { MediaAdminPage } from './MediaAdminPage';
export { ProfileAdminPage } from './ProfileAdminPage';
