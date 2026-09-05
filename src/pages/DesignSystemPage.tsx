/**
 * Superficie de demostracion del sistema de diseno.
 *
 * **Solo desarrollo.** Esta pagina no forma parte del producto: `routes.tsx`
 * solo la registra cuando `import.meta.env.DEV` es cierto, de modo que no
 * existe en el build de produccion y no puede aparecer en el sitemap ni en
 * `robots.txt` de `Task/016`.
 *
 * Por que existe: `Task/013` es una tarea **visual**, y una tarea visual que
 * solo se puede validar leyendo pruebas no es validable. Aqui el usuario abre
 * las primitivas en un navegador real y comprueba con sus propios ojos —y con
 * el inspector— el contraste, el anillo de foco al tabular, el comportamiento
 * al estrechar la ventana y la senal no cromatica de cada tono.
 *
 * Por que no Storybook: seria una dependencia grande y un cambio de naturaleza
 * del proyecto para cinco primitivas. La alternativa evaluada esta en la ficha
 * `TASK-013`, seccion 6.J.
 *
 * Importa **solo desde la superficie publica** (`../components`), igual que
 * haran `Task/014` y `Task/015`: si algo no se pudiera construir asi, seria un
 * defecto del contrato y no de esta pagina.
 */
import { Badge, Button, Card, Container, Stack } from '../components';
import type { BadgeTone, ButtonVariant, StackGap } from '../components';
import styles from './DesignSystemPage.module.css';

const SPACING_STEPS: readonly StackGap[] = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

const BUTTON_VARIANTS: readonly ButtonVariant[] = ['primary', 'secondary'];

const BADGE_TONES: readonly BadgeTone[] = ['neutral', 'success', 'warning', 'danger'];

/** Tokens de color agrupados por su funcion, tal como se consumen. */
const COLOR_GROUPS: readonly { readonly title: string; readonly tokens: readonly string[] }[] = [
  { title: 'Superficies', tokens: ['--color-background', '--color-surface'] },
  {
    title: 'Texto',
    tokens: ['--color-text-primary', '--color-text-secondary', '--color-text-on-interactive'],
  },
  { title: 'Bordes', tokens: ['--color-border', '--color-border-strong'] },
  {
    title: 'Interaccion',
    tokens: ['--color-interactive', '--color-interactive-hover', '--color-focus'],
  },
  {
    title: 'Tono: exito',
    tokens: ['--color-success-text', '--color-success-surface', '--color-success-border'],
  },
  {
    title: 'Tono: aviso',
    tokens: ['--color-warning-text', '--color-warning-surface', '--color-warning-border'],
  },
  {
    title: 'Tono: error',
    tokens: ['--color-danger-text', '--color-danger-surface', '--color-danger-border'],
  },
];

export function DesignSystemPage() {
  return (
    <Container width="wide">
      <Stack gap="2xl" className={styles['page']}>
        <header>
          <Stack gap="xs">
            <h1>Sistema de diseno</h1>
            <p className={styles['lead']}>
              Superficie de demostracion de <code>Task/013</code>. Solo existe en desarrollo: no
              viaja al build de produccion.
            </p>
          </Stack>
        </header>

        <section>
          <Stack gap="lg">
            <h2>Tipografia</h2>
            <Stack gap="sm">
              <h1>Encabezado de nivel 1</h1>
              <h2>Encabezado de nivel 2</h2>
              <h3>Encabezado de nivel 3</h3>
              <h4>Encabezado de nivel 4</h4>
              <p>
                Parrafo de cuerpo. La escala de encabezados es fluida: estrecha la ventana y observa
                como el tamano cambia de forma continua, sin saltos. Dentro del texto, un{' '}
                <a href="#tipografia">enlace conserva su subrayado</a> para no depender del color.
              </p>
              <p className={styles['secondary']}>Texto secundario, para fechas y metadatos.</p>
            </Stack>
          </Stack>
        </section>

        <section>
          <Stack gap="lg">
            <h2>Color</h2>
            <p className={styles['secondary']}>
              Todos los pares de contraste relevantes estan verificados en{' '}
              <code>contrast.test.ts</code> sobre estos mismos valores.
            </p>
            <div className={styles['swatchGrid']}>
              {COLOR_GROUPS.map((group) => (
                <Card key={group.title}>
                  <Stack gap="sm">
                    <h3>{group.title}</h3>
                    {group.tokens.map((token) => (
                      <Stack key={token} direction="horizontal" gap="xs" align="center">
                        <span
                          className={styles['swatch']}
                          style={{ backgroundColor: `var(${token})` }}
                        />
                        <code>{token}</code>
                      </Stack>
                    ))}
                  </Stack>
                </Card>
              ))}
            </div>
          </Stack>
        </section>

        <section>
          <Stack gap="lg">
            <h2>Espaciado</h2>
            <p className={styles['secondary']}>
              Siete pasos. Es la unica escala de separacion del sistema.
            </p>
            <Stack gap="xs">
              {SPACING_STEPS.map((step) => (
                <Stack key={step} direction="horizontal" gap="sm" align="center">
                  <code className={styles['stepLabel']}>{step}</code>
                  <span
                    className={styles['spacingBar']}
                    style={{ inlineSize: `var(--space-${step})` }}
                  />
                </Stack>
              ))}
            </Stack>
          </Stack>
        </section>

        <section>
          <Stack gap="lg">
            <h2>Button</h2>
            <p className={styles['secondary']}>
              Tabula hasta aqui con el teclado para ver el anillo de foco. El boton deshabilitado no
              recibe foco ni se activa.
            </p>
            <Stack direction="horizontal" gap="md" wrap align="center">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={`${variant}-disabled`} variant={variant} disabled>
                  {variant} deshabilitado
                </Button>
              ))}
            </Stack>
          </Stack>
        </section>

        <section>
          <Stack gap="lg">
            <h2>Badge</h2>
            <p className={styles['secondary']}>
              Cada tono anade una silueta propia —circulo, triangulo, octogono— ademas del color.
              Ponlo en escala de grises: el significado sigue siendo legible.
            </p>
            <Stack direction="horizontal" gap="sm" wrap align="center">
              {BADGE_TONES.map((tone) => (
                <Badge key={tone} tone={tone}>
                  {tone}
                </Badge>
              ))}
            </Stack>
          </Stack>
        </section>

        <section>
          <Stack gap="lg">
            <h2>Card y Container</h2>
            <p className={styles['secondary']}>
              Estrecha la ventana: las tarjetas no fuerzan desplazamiento horizontal y el margen
              lateral se ajusta de forma continua.
            </p>
            <div className={styles['cardGrid']}>
              <Card>
                <Stack gap="xs">
                  <h3>Una tarjeta</h3>
                  <p className={styles['secondary']}>
                    Superficie, borde y radio del sistema. Sin sombra: el lenguaje visual es plano.
                  </p>
                </Stack>
              </Card>
              <Card>
                <Stack gap="sm" align="start">
                  <h3>Con acciones</h3>
                  <Stack direction="horizontal" gap="xs" wrap>
                    <Badge tone="success">publicado</Badge>
                    <Badge>arquitectura</Badge>
                  </Stack>
                  <Button variant="secondary">Ver mas</Button>
                </Stack>
              </Card>
            </div>
          </Stack>
        </section>
      </Stack>
    </Container>
  );
}
