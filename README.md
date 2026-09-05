# personal-blog-frontend

Interfaz del blog personal. **React + TypeScript + Vite.**

> **Estado: fundación + sistema de diseño.** El proyecto arranca, enruta, construye y
> tiene suite de pruebas, y desde `Task/013` cuenta con tokens, fundación global y
> primitivas compartidas. Todavía **no** hay contenido ni panel administrativo: la
> pantalla de inicio sigue siendo provisional y está identificada como tal.

---

## 1. Responsabilidad del repositorio

- Sitio público: Inicio, Quién soy, Artículos, Reviews de libros, Videos, Proyectos y
  laboratorio, Contacto y enlaces, página 404.
- Panel administrativo: dashboard, editor Markdown, gestión de contenido, carga de
  imágenes y vista previa.
- Sistema de diseño: tokens, componentes, tipografía, responsive y accesibilidad.
- Cliente HTTP hacia el API y manejo de errores.
- SEO en el lado del cliente: metadatos y Open Graph.
- Pruebas de interfaz y build de producción.

## 2. Qué NO pertenece a este repositorio

- Lógica de dominio, acceso a base de datos, autenticación del lado servidor →
  `personal-blog-backend`.
- Docker Compose del entorno, Terraform, runbooks → `personal-blog-infra`.
- Roadmap, estado del proyecto, ADR → `personal-blog-infra`.
- Secretos, credenciales o archivos `.env` reales.

## 3. Qué existe hoy y qué no

Lo que la fundación entrega:

| Pieza | Dónde |
| --- | --- |
| Arranque de React y montaje | `src/main.tsx` |
| Composición de la aplicación | `src/app/App.tsx` |
| Tabla de rutas y router | `src/app/routes.tsx` |
| Configuración de entorno tipada y validada | `src/lib/config/env.ts` |
| Cliente HTTP común | `src/services/http/` |
| Modelo de error de la capa HTTP | `src/services/http/httpError.ts` |
| Pantalla provisional de fundación | `src/pages/HomePage.tsx` |
| Página 404 | `src/pages/NotFoundPage.tsx` |
| Tokens de diseño | `src/styles/tokens.css` |
| Fundación global: tipografía, foco, motion | `src/styles/foundation.css` |
| Primitivas compartidas | `src/components/` |
| Superficie pública del sistema de diseño | `src/components/index.ts` |
| Cálculo de contraste (WCAG) | `src/lib/color/contrast.ts` |

Lo que **todavía no existe**, con su tarea propietaria:

| Falta | Tarea |
| --- | --- |
| Páginas y navegación del sitio público | `Task/014` |
| Panel administrativo y editor Markdown | `Task/015` |
| Autenticación y sesión | `Task/011`, `Task/015` |
| Consumo real del API y CORS | `Task/007` |
| SEO, sitemap y RSS | `Task/014`, `Task/019` |
| Despliegue en Cloudflare Pages | `Task/034`, `Task/037` |

Estado vigente del proyecto:
[`personal-blog-infra/docs/project-management/STATUS.md`](../personal-blog-infra/docs/project-management/STATUS.md)

## 3.1 Sistema de diseño

Desde `Task/013`. **Sin dependencias de terceros**: CSS Modules —nativos de Vite— y CSS
Custom Properties.

```ts
import { Badge, Button, Card, Container, Stack } from './components';
```

| Pieza | Dónde | Regla |
| --- | --- | --- |
| Tokens | `src/styles/tokens.css` | Única fuente de color, tipografía, espaciado, forma, layout, foco y movimiento. |
| Fundación | `src/styles/foundation.css` | Defaults del documento y **estrategia única de foco visible**. |
| Primitivas | `src/components/` | `Container`, `Stack`, `Button`, `Card`, `Badge`. |
| Superficie pública | `src/components/index.ts` | Punto de entrada previsto; no se importan archivos internos. |

Reglas que la suite hace cumplir automáticamente
(`src/styles/designSystem.guards.test.ts`):

- Ningún componente define un color propio: todos vienen de los tokens.
- Ningún `var(--…)` apunta a un token inexistente.
- Ningún CSS suprime el `outline` ni redefine el foco por su cuenta.
- Ninguna primitiva usa media queries de ancho: el responsive es intrínseco.

El contraste de la paleta se verifica con ratios reales en `src/styles/contrast.test.ts`.

### Ver el sistema en el navegador

Con el servidor de desarrollo en marcha, `/__design-system` muestra tokens, tipografía,
espaciado y primitivas. **Existe solo en desarrollo**: la ruta y su página no forman
parte del build de producción.

---

## 4. Stack

| Pieza | Elección |
| --- | --- |
| Framework | React 19 |
| Lenguaje | TypeScript 5.9, modo estricto |
| Build y dev server | Vite 8 |
| Enrutado | React Router 8, en modo declarativo por datos |
| Pruebas | Vitest 4 + Testing Library + jsdom |
| Lint | ESLint 10 con `typescript-eslint` (reglas que consultan tipos) |
| Formato | Prettier 3 |
| Gestor de paquetes | npm, con `package-lock.json` versionado |

Las versiones exactas están fijadas en `package.json`: se declaran sin rango (`19.2.8`,
no `^19.2.8`) para que dos instalaciones separadas produzcan el mismo árbol, igual que
el backend fija sus dependencias con `==`.

## 5. Requisitos locales

- **Node.js 20.19 o superior.** Verificado sobre Node 24.
- **npm 10 o superior**, incluido con Node.

No hace falta Docker para desarrollar el frontend. La integración con el resto del
entorno local llega en `Task/007`.

## 6. Instalación

```powershell
npm ci
```

`npm ci` instala exactamente lo que dice `package-lock.json`. Usa `npm install`
únicamente cuando quieras añadir o actualizar una dependencia.

## 7. Configuración de entorno

```powershell
Copy-Item .env.example .env.local
```

| Variable | Significado |
| --- | --- |
| `VITE_API_BASE_URL` | Origen del API del backend, **sin** `/api/v1` y **sin** barra final. |

Por qué es el origen y no la base del contrato: `/api/v1` versiona los recursos, pero
`/health` vive fuera de ese prefijo a propósito
([`api-contracts.md`](../personal-blog-infra/docs/architecture/api-contracts.md),
sección 2). Una única base que sirva para ambos tiene que situarse por encima de los dos.

La configuración se **valida al arrancar** (`src/lib/config/env.ts`): si la variable
falta o no es una URL absoluta `http`/`https`, la aplicación no monta y el error dice
cuál es la variable. Es el requisito T-01 de
[`non-functional-requirements.md`](../personal-blog-infra/docs/architecture/non-functional-requirements.md).

> **Todo valor `VITE_*` acaba en el bundle** y es legible por cualquiera que abra la
> aplicación. Ahí no va ningún secreto. Los secretos viven en el backend.

## 8. Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Comprueba tipos y genera el build de producción en `dist/`. |
| `npm run preview` | Sirve `dist/` para comprobar el artefacto ya construido. |
| `npm run typecheck` | Comprobación de tipos, sin generar nada. |
| `npm run lint` | ESLint sobre el proyecto. |
| `npm run test` | Vitest en modo interactivo. |
| `npm run test:run` | Vitest una sola pasada. |
| `npm run test:coverage` | Vitest con informe de cobertura. |
| `npm run format` | Aplica Prettier. |
| `npm run format:check` | Comprueba el formato sin modificar nada. |

Antes de marcar una tarea como lista deben terminar sin errores: `lint`, `typecheck`,
`format:check`, `test:run` y `build`.

## 9. Estructura

```
src/
├── app/          Composición global: raíz, router y contexto de configuración.
├── pages/        Una pantalla por ruta. Ensamblan, no implementan.
├── components/   Sistema de diseño: primitivas compartidas, sin dominio ni HTTP.
├── services/     Única capa que habla HTTP.
├── lib/          Utilidades puras y sin estado: configuración y contraste.
├── styles/       Tokens de diseño y estilos globales.
├── test/         Preparación común de la suite.
└── main.tsx      Punto de entrada.
```

La estructura completa prevista —`features/`, `entities/`, `hooks/`,
`assets/`— está definida en
[`software-architecture.md`](../personal-blog-infra/docs/architecture/software-architecture.md),
sección 4. Aquí solo existen las carpetas que ya tienen contenido: una carpeta vacía no
documenta una decisión, solo anticipa una.

Las pruebas viven junto al archivo que prueban (`env.ts` y `env.test.ts`), no en un
árbol paralelo: así una carpeta muestra de un vistazo qué está cubierto y qué no.

## 10. Arquitectura general (resumen)

| Entorno | Cómo se sirve este frontend |
| --- | --- |
| **Local** | Build de Vite servido tras un reverse proxy local, consumiendo el API de FastAPI. Orquestado con Docker Compose y supervisado con Portainer CE. |
| **Nube** | Estáticos publicados en Cloudflare Pages, consumiendo el API expuesto por API Gateway HTTP API sobre AWS Lambda. |

El mismo build sirve para ambos entornos: la URL del API se inyecta como variable de
entorno en tiempo de build. El artefacto es estático y no depende de ningún proveedor
concreto (requisito T-05). Detalle completo en
[`local-to-cloud-mapping.md`](../personal-blog-infra/docs/architecture/local-to-cloud-mapping.md).

> El enrutado es de tipo SPA: cualquier ruta profunda debe servir `index.html`. El
> `preview` de Vite ya se comporta así; el reverse proxy local (`Task/007`) y el
> hosting estático (`Task/034`) tendrán que hacer lo mismo.

## 11. Estrategia de ramas

| Rama | Propósito |
| --- | --- |
| `main` | Versión estable o liberable. **Única base permitida de las ramas Task.** |
| `dev` | **Solo integración** de tareas aprobadas. **Nunca base de una Task.** |
| `Task/<numero>-<nombre>` | Trabajo aislado de una tarea, creado **desde `main`**. |

> **Invariante crítico:** toda rama `Task/<...>` nace desde `main` actualizado y limpio.
> `dev` nunca es base de una Task. Motivo y validaciones:
> [WORKFLOW §2.1](../personal-blog-infra/docs/project-management/WORKFLOW.md).

Una tarea que afecta a varios repositorios usa **el mismo nombre de rama** en todos, y
**todas nacen de `main`**. No se hace merge automático hacia `main`.

El estado vivo de las ramas se consulta en Git y GitHub, no en este archivo
([WORKFLOW §6.1](../personal-blog-infra/docs/project-management/WORKFLOW.md)).

## 12. Fuente de verdad de la planificación

Toda la planificación vive en **`personal-blog-infra`**. Este README no la duplica.

| Qué buscas | Dónde está |
| --- | --- |
| Roadmap completo | [`docs/project-management/ROADMAP.md`](../personal-blog-infra/docs/project-management/ROADMAP.md) |
| Estado actual y tareas pendientes | [`docs/project-management/STATUS.md`](../personal-blog-infra/docs/project-management/STATUS.md) |
| Proceso de trabajo | [`docs/project-management/WORKFLOW.md`](../personal-blog-infra/docs/project-management/WORKFLOW.md) |
| Definición de terminado | [`docs/project-management/DEFINITION_OF_DONE.md`](../personal-blog-infra/docs/project-management/DEFINITION_OF_DONE.md) |
| Decisiones arquitectónicas | [`docs/adr/`](../personal-blog-infra/docs/adr/) |

*(Los enlaces relativos asumen que los tres repositorios están clonados como carpetas
hermanas dentro del mismo directorio de trabajo.)*

## 13. Tareas previstas para este repositorio

`Task/014`, `Task/015`, `Task/019`, `Task/037`, y participación en
`Task/016`, `Task/018`, `Task/022`, `Task/034`, `Task/036`, `Task/040`.

`Task/006`, `Task/007` y `Task/013` ya están entregadas en este repositorio.

## 14. Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
