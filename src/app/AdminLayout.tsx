/**
 * Layout del panel administrativo (`Task/015`).
 *
 * Es **hermano** de `SiteLayout`, no un envoltorio suyo: el sitio publico no se
 * toca, y el panel no hereda ni su cabecera ni su buscador. Las doce superficies
 * publicas de `Task/014` siguen exactamente como estaban.
 *
 * Aqui vive el `AdminSessionProvider`, y esa colocacion es la decision
 * **D-015-G**: al envolver **solo** este subarbol, un visitante del sitio
 * publico nunca dispara `GET /admin/auth/me`. Si el proveedor estuviera en
 * `App`, cada visita anonima a `/` haria una peticion administrativa inutil que
 * ademas respondería `401`.
 *
 * Accesibilidad (**A-01**, **A-02**), con el mismo patron que `SiteLayout`:
 * enlace de salto como primer elemento enfocable, landmarks nativos —`header`,
 * `nav`, `main`, `footer`—, `NavLink` con `aria-current="page"` y un estilo
 * activo que refuerza con peso y subrayado, no solo con color (**A-07**).
 */
import { NavLink, Outlet } from 'react-router';

import styles from './AdminLayout.module.css';
import { AdminSessionProvider } from './AdminSessionProvider';
import { useAdminSession } from './adminSessionContext';
import { Button, Container } from '../components';
import { RUTAS } from '../lib/rutas';
import { RUTAS_ADMIN, SECCIONES_ADMIN } from '../lib/rutasAdmin';

/** Cabecera con la identidad y el cierre de sesion, si hay sesion abierta. */
function BarraDeSesion() {
  const { estado, salir } = useAdminSession();

  if (estado.fase !== 'autenticada') {
    return null;
  }

  return (
    <div className={styles['sesion']}>
      <span className={styles['identidad']}>{estado.administrador.display_name}</span>
      <Button
        variant="secondary"
        onClick={() => {
          void salir();
        }}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}

/** Navegacion del panel. Se oculta sin sesion: no hay nada que navegar. */
function NavegacionDelPanel() {
  const { estado } = useAdminSession();

  if (estado.fase !== 'autenticada') {
    return null;
  }

  return (
    <nav aria-label="Panel administrativo">
      <ul className={styles['navegacion']}>
        {SECCIONES_ADMIN.map((seccion) => (
          <li key={seccion.ruta}>
            <NavLink
              to={seccion.ruta}
              end={seccion.ruta === RUTAS_ADMIN.panel}
              className={styles['enlace'] ?? ''}
            >
              {seccion.nombre}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminLayout() {
  return (
    <AdminSessionProvider>
      <a className={styles['skipLink']} href="#panel">
        Saltar al contenido
      </a>

      <header className={styles['header']}>
        <Container width="wide">
          <div className={styles['barra']}>
            <p className={styles['marca']}>Panel administrativo</p>
            <BarraDeSesion />
          </div>
          <NavegacionDelPanel />
        </Container>
      </header>

      <main id="panel" tabIndex={-1} className={styles['main']}>
        <Container width="wide">
          <Outlet />
        </Container>
      </main>

      <footer className={styles['footer']}>
        <Container width="wide">
          <a href={RUTAS.inicio}>Ver el sitio público</a>
        </Container>
      </footer>
    </AdminSessionProvider>
  );
}
