/**
 * Guarda de las rutas del panel.
 *
 * **No es un limite de seguridad**, y decirlo importa: `software-architecture.md`
 * seccion 4.4 es explicito —*"el frontend no toma decisiones de autorizacion:
 * oculta la interfaz por comodidad, pero el backend es quien autoriza"*—.
 * Quien decide es el servidor, y cualquier `401` suyo es autoridad.
 *
 * Tres comportamientos, y ninguno mas:
 *
 * 1. Con la sesion **desconocida** se espera. No se redirige: mientras `/me` no
 *    ha respondido no se sabe nada, y echar al administrador en ese hueco haria
 *    que cada recarga lo sacara del panel.
 * 2. Con sesion **anonima** se navega a la ruta de acceso, con `replace` para no
 *    dejar una entrada de historial a la que volver con el boton atras.
 * 3. Con sesion **autenticada** se renderiza el contenido.
 *
 * El destino solicitado viaja en el **estado del router**, no en la URL: un
 * `?next=` seria compartible y, con el, un vector de redireccion abierta. Su
 * validacion vive en `esDestinoInternoDelPanel`.
 */
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAdminSession } from './adminSessionContext';
import { LoadingState } from '../components';
import { RUTAS_ADMIN } from '../lib/rutasAdmin';

export function RutaProtegida() {
  const { estado } = useAdminSession();
  const location = useLocation();

  if (estado.fase === 'desconocida') {
    return <LoadingState>Comprobando la sesión…</LoadingState>;
  }

  if (estado.fase === 'anonima') {
    const destino = `${location.pathname}${location.search}`;
    return <Navigate to={RUTAS_ADMIN.acceso} replace state={{ destino }} />;
  }

  return <Outlet />;
}
