/**
 * Layout del sitio publico (`Task/014`).
 *
 * Es la unica pieza que conoce la estructura de la pagina completa: enlace de
 * salto, cabecera con navegacion principal y buscador, `main` y pie. Las
 * paginas solo aportan su contenido a traves de `Outlet`, o como `children`
 * cuando el comodin 404 lo monta directamente.
 *
 * Accesibilidad (A-01, A-02):
 *
 * - Los landmarks son elementos nativos: `header`, `nav`, `main`, `footer`.
 * - El enlace de salto es el **primer** elemento enfocable del documento y
 *   apunta a `main#contenido`, que lleva `tabIndex={-1}` para poder recibir el
 *   foco sin entrar en el orden de tabulacion.
 * - `NavLink` anade `aria-current="page"` a la seccion activa; el estilo
 *   activo se apoya en ese atributo y no en una clase, y refuerza con peso y
 *   subrayado, no solo con color (A-07).
 * - El buscador es un `<form role="search">` con `<label>` visible e
 *   `<input type="search">` nativos. `Form` de react-router lo convierte en
 *   una navegacion del lado del cliente a `/buscar?q=...`, sin recargar el
 *   documento y sin ningun componente de formulario especulativo.
 *
 * El `SkipLink` es especifico de este layout —un unico consumidor— y por eso
 * vive aqui, no en `components`.
 */
import type { ReactNode } from 'react';
import { Form, Link, NavLink, Outlet, useSearchParams } from 'react-router';

import styles from './SiteLayout.module.css';
import { Button, Container } from '../components';
import { RUTAS, SECCIONES } from '../lib/rutas';
import { NOMBRE_DEL_SITIO } from '../lib/site';

export interface SiteLayoutProps {
  /** Contenido a montar en lugar del `Outlet`. Lo usa el comodin 404. */
  readonly children?: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const [parametros] = useSearchParams();
  const terminoActual = parametros.get('q') ?? '';

  return (
    <>
      <a className={styles['skipLink']} href="#contenido">
        Saltar al contenido
      </a>

      <header className={styles['header']}>
        <Container width="wide">
          <div className={styles['barra']}>
            <Link to={RUTAS.inicio} className={styles['marca']}>
              {NOMBRE_DEL_SITIO}
            </Link>

            <nav aria-label="Principal">
              <ul className={styles['navegacion']}>
                <li>
                  <NavLink to={RUTAS.inicio} end className={styles['enlace'] ?? ''}>
                    Inicio
                  </NavLink>
                </li>
                {SECCIONES.map((seccion) => (
                  <li key={seccion.ruta}>
                    <NavLink to={seccion.ruta} className={styles['enlace'] ?? ''}>
                      {seccion.nombre}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <Form
              role="search"
              method="get"
              action={RUTAS.buscar}
              className={styles['buscador']}
              // Al cambiar el termino la URL cambia: la clave hace que el campo
              // refleje el termino vigente sin controlar el input desde React.
              key={terminoActual}
            >
              <label htmlFor="buscador-termino" className={styles['etiquetaBuscador']}>
                Buscar
              </label>
              <input
                id="buscador-termino"
                className={styles['campoBuscador']}
                type="search"
                name="q"
                defaultValue={terminoActual}
                autoComplete="off"
              />
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
            </Form>
          </div>
        </Container>
      </header>

      <main id="contenido" tabIndex={-1} className={styles['main']}>
        {children ?? <Outlet />}
      </main>

      <footer className={styles['footer']}>
        <Container width="wide">
          <div className={styles['pie']}>
            <p className={styles['textoPie']}>{NOMBRE_DEL_SITIO}</p>
            <nav aria-label="Pie de página">
              <ul className={styles['navegacion']}>
                <li>
                  <Link to={RUTAS.quienSoy}>Quién soy</Link>
                </li>
                <li>
                  <Link to={RUTAS.contacto}>Contacto</Link>
                </li>
              </ul>
            </nav>
          </div>
        </Container>
      </footer>
    </>
  );
}
