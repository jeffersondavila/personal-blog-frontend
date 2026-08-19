/**
 * Pantalla de fundacion.
 *
 * **Estado temporal del proyecto.** No es la portada del blog: la portada, el
 * sistema de diseno y el contenido real son `Task/013` y `Task/014`. Esta
 * pantalla existe unicamente para que se pueda comprobar, sin abrir la
 * consola, que React monta, que el router resuelve la ruta inicial y que la
 * configuracion de entorno llego hasta la interfaz.
 *
 * Mostrar aqui el origen del API no filtra nada: Vite incrusta toda variable
 * `VITE_*` en el bundle, de modo que ese valor ya es publico por construccion.
 * Por eso mismo ninguna variable `VITE_*` puede contener un secreto
 * (`CONTRIBUTING.md`, seccion 7).
 */
import { useAppConfig } from '../app/appConfigContext';

export function HomePage() {
  const { apiBaseUrl } = useAppConfig();

  return (
    <main>
      <h1>Blog personal — fundacion del frontend</h1>

      <p>
        Este repositorio esta en <strong>ETAPA 02</strong>. Lo que ves es una pantalla provisional:
        confirma que la aplicacion React monta, que el enrutado responde y que la configuracion de
        entorno se cargo correctamente.
      </p>

      <h2>Configuracion activa</h2>
      <dl>
        <dt>Origen del API</dt>
        <dd>
          <code>{apiBaseUrl}</code>
        </dd>
      </dl>

      <h2>Que todavia no existe</h2>
      <ul>
        <li>Sistema de diseno y portada definitiva.</li>
        <li>Articulos, reviews, videos y proyectos.</li>
        <li>Panel administrativo y autenticacion.</li>
        <li>Consumo real del API, que llega con la integracion local.</li>
      </ul>
    </main>
  );
}
