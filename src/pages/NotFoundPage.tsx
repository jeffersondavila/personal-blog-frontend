/**
 * Destino de cualquier ruta no reconocida.
 *
 * La pagina 404 del sitio publico —con su diseno y sus enlaces reales— es
 * `Task/014`. Esta version cumple lo minimo que no puede faltar en una SPA:
 * decir que la direccion no existe y ofrecer una salida, en vez de dejar al
 * visitante ante una pantalla vacia.
 *
 * Se usa `Link` y no un `<a href>` a proposito: un ancla normal provocaria una
 * recarga completa del documento y perderia el estado del enrutado.
 */
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main>
      <h1>404 — pagina no encontrada</h1>

      <p>La direccion que abriste no corresponde a ninguna seccion de este sitio.</p>

      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </main>
  );
}
