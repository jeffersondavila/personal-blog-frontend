/**
 * Acceso al panel (`USER_FLOWS.md` B.1).
 *
 * Es la **unica** ruta del panel sin guarda, porque `login` es el unico endpoint
 * administrativo publico (`security-boundaries.md` seccion 11.4).
 *
 * Tres reglas del contrato que la interfaz no puede relajar:
 *
 * - **El error es generico.** Correo inexistente, contrasena incorrecta y cuenta
 *   bloqueada comparten estado, `code` y mensaje (`api-contracts.md` seccion
 *   13.4). Distinguirlos aqui filtraria si una cuenta existe.
 * - **`403` no es `401`.** Un origen no permitido es configuracion del backend;
 *   tratarlo como sesion caducada produciria un bucle contra esta misma pagina.
 * - **`429` se respeta.** Se deshabilita el envio y se dice que hay que esperar,
 *   sin reintento automatico.
 *
 * El destino al que volver llega en el **estado del router** y se valida con
 * `esDestinoInternoDelPanel`: nunca se acepta una URL absoluta ni una ruta fuera
 * del panel.
 */
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { useAdminSession } from '../../app/adminSessionContext';
import { Button, Card, Container, FormFeedback, FormField, Stack } from '../../components';
import {
  esLimiteDeIntentos,
  esOrigenNoPermitido,
  mensajeDeError,
} from '../../features/admin/errores';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { esDestinoInternoDelPanel, RUTAS_ADMIN } from '../../lib/rutasAdmin';
import { HttpError } from '../../services/http';

/** Mensaje unico de credenciales. Se escribe una vez para no divergir. */
const CREDENCIALES_INVALIDAS = 'Credenciales inválidas.';

type Envio = 'inactivo' | 'enviando';

export function LoginPage() {
  useDocumentTitle('Acceso al panel');
  const { estado, entrar } = useAdminSession();
  const navegar = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [envio, setEnvio] = useState<Envio>('inactivo');
  const [error, setError] = useState<string | null>(null);
  const [esperaHasta, setEsperaHasta] = useState<number | null>(null);
  const limitado = esperaHasta !== null;

  useEffect(() => {
    if (esperaHasta === null) {
      return;
    }
    const fin = esperaHasta;
    // Limite tecnico de setTimeout: una espera larga nunca debe vencer antes.
    const demora = () => Math.min(Math.max(0, fin - Date.now()), 2_147_483_647);
    let timer = window.setTimeout(comprobarFin, demora());
    function comprobarFin() {
      if (Date.now() < fin) {
        timer = window.setTimeout(comprobarFin, demora());
      } else {
        setEsperaHasta(null);
      }
    }
    // Tambien cancela el timer anterior si se establece una nueva espera.
    return () => {
      window.clearTimeout(timer);
    };
  }, [esperaHasta]);

  const destinoPropuesto = (location.state as { destino?: unknown } | null)?.destino;
  const destino = esDestinoInternoDelPanel(destinoPropuesto) ? destinoPropuesto : RUTAS_ADMIN.panel;

  useEffect(() => {
    if (estado.fase === 'autenticada') {
      void navegar(destino, { replace: true });
    }
  }, [estado.fase, destino, navegar]);

  /*
   * Con sesion ya abierta no se muestra un formulario de acceso a quien acaba de
   * entrar. El efecto de arriba cubre el caso en que la sesion aparece mientras
   * la pagina esta montada; esto cubre el de llegar ya autenticado.
   */
  if (estado.fase === 'autenticada') {
    return <Navigate to={destino} replace />;
  }

  const enviando = envio === 'enviando';

  async function alEnviar(evento: { preventDefault: () => void }) {
    evento.preventDefault();
    if (enviando || limitado) {
      return; // Protege tambien el submit directo durante la espera.
    }

    setEnvio('enviando');
    setError(null);

    try {
      await entrar(email, password);
    } catch (causa) {
      setPassword('');
      if (esLimiteDeIntentos(causa)) {
        const segundos = causa instanceof HttpError ? causa.retryAfterSeconds : undefined;
        // Sin header valido no se inventa una espera: solo se permite retry manual.
        setEsperaHasta(segundos === undefined ? null : Date.now() + segundos * 1000);
        setError('Demasiados intentos. Espera antes de volver a intentarlo.');
      } else if (esOrigenNoPermitido(causa)) {
        setError(mensajeDeError(causa));
      } else {
        setError(CREDENCIALES_INVALIDAS);
      }
      setEnvio('inactivo');
    }
  }

  return (
    <Container width="prose">
      <Card>
        <Stack gap="md">
          <h1>Acceso al panel</h1>

          {error !== null ? <FormFeedback tono="error">{error}</FormFeedback> : null}

          <form
            onSubmit={(evento) => {
              void alEnviar(evento);
            }}
            noValidate
          >
            <Stack gap="md">
              <FormField label="Correo" required>
                {(atributos) => (
                  <input
                    {...atributos}
                    type="email"
                    name="email"
                    autoComplete="username"
                    maxLength={254}
                    value={email}
                    onChange={(evento) => {
                      setEmail(evento.target.value);
                    }}
                  />
                )}
              </FormField>

              <FormField label="Contraseña" required>
                {(atributos) => (
                  <input
                    {...atributos}
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    maxLength={1024}
                    value={password}
                    onChange={(evento) => {
                      setPassword(evento.target.value);
                    }}
                  />
                )}
              </FormField>

              <div>
                <Button type="submit" disabled={enviando || limitado}>
                  {enviando ? 'Entrando…' : 'Entrar'}
                </Button>
              </div>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Container>
  );
}
