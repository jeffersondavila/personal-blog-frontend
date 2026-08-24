/**
 * Pantalla de fundacion.
 *
 * **Estado temporal del proyecto.** No es la portada del blog: la portada, el
 * sistema de diseno y el contenido real son `Task/013` y `Task/014`. Esta
 * pantalla existe unicamente para comprobar, sin abrir la consola, que React
 * monta, que el router resuelve la ruta inicial, que la configuracion de
 * entorno llego hasta la interfaz y —desde `Task/007`— que el frontend alcanza
 * de verdad al backend a traves del reverse proxy local.
 *
 * Mostrar aqui el origen del API no filtra nada: Vite incrusta toda variable
 * `VITE_*` en el bundle, de modo que ese valor ya es publico por construccion.
 * Por eso mismo ninguna variable `VITE_*` puede contener un secreto
 * (`CONTRIBUTING.md`, seccion 7).
 */
import { useEffect, useMemo, useState } from 'react';

import { useAppConfig } from '../app/appConfigContext';
import { createHttpClient } from '../services/http';
import { fetchBackendHealth, type BackendHealth } from '../services/health';

/** Estado de la consulta al backend. */
type EstadoDeSalud =
  | { readonly fase: 'consultando' }
  | { readonly fase: 'disponible'; readonly salud: BackendHealth }
  | { readonly fase: 'sin-respuesta' };

export function HomePage() {
  const { apiBaseUrl } = useAppConfig();

  // El cliente se memoriza para no reconstruirlo en cada render. No se eleva a
  // un proveedor: hasta que haya mas de un consumidor, un contexto adicional
  // seria una capa sin uso.
  const httpClient = useMemo(() => createHttpClient({ baseUrl: apiBaseUrl }), [apiBaseUrl]);

  const [estado, setEstado] = useState<EstadoDeSalud>({ fase: 'consultando' });

  useEffect(() => {
    // El `signal` se propaga hasta `fetch`: al desmontar, la peticion en vuelo
    // se **aborta de verdad**, no se queda corriendo con su resultado
    // descartado. La comprobacion de `aborted` que sigue cubre la carrera que
    // el abort no puede evitar: que la promesa ya se hubiera resuelto justo
    // antes de cancelar.
    const controlador = new AbortController();

    void (async () => {
      try {
        const salud = await fetchBackendHealth(httpClient, controlador.signal);
        if (!controlador.signal.aborted) {
          setEstado({ fase: 'disponible', salud });
        }
      } catch {
        // Una cancelacion no es un fallo del backend: si se aborto, no hay nada
        // que informar. El detalle del resto de fallos tampoco se muestra: un
        // error del API puede arrastrar informacion interna y esta pantalla es
        // publica. El diagnostico real se hace con los logs y con Portainer
        // (runbook del entorno local).
        if (!controlador.signal.aborted) {
          setEstado({ fase: 'sin-respuesta' });
        }
      }
    })();

    return () => {
      controlador.abort();
    };
  }, [httpClient]);

  return (
    <main>
      <h1>Blog personal — fundacion del frontend</h1>

      <p>
        Este repositorio esta en <strong>ETAPA 02</strong>. Lo que ves es una pantalla provisional:
        confirma que la aplicacion React monta, que el enrutado responde, que la configuracion de
        entorno se cargo correctamente y que el backend es alcanzable.
      </p>

      <h2>Configuracion activa</h2>
      <dl>
        <dt>Origen del API</dt>
        <dd>
          <code>{apiBaseUrl}</code>
        </dd>
      </dl>

      <h2>Estado del backend</h2>
      <p>
        Consulta real a <code>GET /health</code> mediante el cliente HTTP comun.
      </p>
      <dl>
        <dt>Conexion</dt>
        <dd data-testid="estado-backend">{describirEstado(estado)}</dd>

        {estado.fase === 'disponible' && (
          <>
            <dt>Servicio</dt>
            <dd>
              <code>{estado.salud.service}</code>
            </dd>

            <dt>Version</dt>
            <dd>
              <code>{estado.salud.version}</code>
            </dd>
          </>
        )}
      </dl>

      <h2>Que todavia no existe</h2>
      <ul>
        <li>Sistema de diseno y portada definitiva.</li>
        <li>Articulos, reviews, videos y proyectos.</li>
        <li>Panel administrativo y autenticacion.</li>
        <li>Almacenamiento de objetos a traves de la interfaz del backend.</li>
      </ul>
    </main>
  );
}

/** Texto que describe el estado de la consulta, sin detalles del fallo. */
function describirEstado(estado: EstadoDeSalud): string {
  switch (estado.fase) {
    case 'consultando':
      return 'Consultando el backend...';
    case 'disponible':
      return 'Backend disponible';
    case 'sin-respuesta':
      return 'Backend sin respuesta';
  }
}
