/**
 * Ruta desconocida **dentro** del panel.
 *
 * Es distinta de la 404 publica a proposito: quien esta administrando no deberia
 * salir al sitio publico por escribir mal una direccion. Conserva la navegacion
 * del panel, que la aporta `AdminLayout`.
 *
 * El **codigo HTTP** real `404` de la SPA sigue siendo de `Task/016` y
 * `Task/034`; aqui solo esta la superficie.
 */
import { Link } from 'react-router';

import { Card, Stack } from '../../components';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { RUTAS_ADMIN } from '../../lib/rutasAdmin';

export function AdminNotFoundPage() {
  useDocumentTitle('Página no encontrada');

  return (
    <Card>
      <Stack gap="sm">
        <h1>Esta página del panel no existe</h1>
        <p>Comprueba la dirección o vuelve al panel.</p>
        <Link to={RUTAS_ADMIN.panel}>Volver al panel</Link>
      </Stack>
    </Card>
  );
}
