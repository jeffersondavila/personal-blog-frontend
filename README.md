# personal-blog-frontend

Interfaz del blog personal. **React + TypeScript + Vite.**

> **Estado: sitio público construido; panel pendiente.** Desde `Task/014` el sitio público
> es real: Inicio, Quién soy, Artículos, Reviews, Videos, Proyectos, Contacto, búsqueda,
> filtro por etiqueta y página 404, sobre el sistema de diseño de `Task/013` y el API
> público de `Task/009`. El panel administrativo llega en `Task/015`.

---

## 1. Responsabilidad del repositorio

- Sitio público: Inicio, Quién soy, Artículos, Reviews de libros, Videos, Proyectos y
  laboratorio, Contacto y enlaces, búsqueda y página 404.
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

| Pieza | Dónde |
| --- | --- |
| Arranque de React y montaje | `src/main.tsx` |
| Composición de la aplicación y cliente HTTP compartido | `src/app/App.tsx`, `src/app/httpClientContext.ts` |
| Tabla de rutas y layout del sitio público | `src/app/routes.tsx`, `src/app/SiteLayout.tsx` |
| Configuración de entorno tipada y validada | `src/lib/config/env.ts` |
| Cliente HTTP común y modelo de error | `src/services/http/` |
| Adaptadores del API público y tipos del contrato | `src/services/public/` |
| Páginas del sitio público | `src/pages/` |
| Componentes de entidad: tarjetas, imagen, fecha, etiquetas, valoración, proveedores de video | `src/entities/` |
| Render Markdown sanitizado (pipeline único) | `src/features/markdown/` |
| Hooks: recurso asíncrono, título de documento, parámetros de listado | `src/hooks/` |
| Tokens de diseño y fundación global | `src/styles/` |
| Primitivas y componentes compartidos | `src/components/` |
| Favicon provisional | `public/favicon.svg` |

Lo que **todavía no existe**, con su tarea propietaria:

| Falta | Tarea |
| --- | --- |
| Panel administrativo, editor Markdown y vista previa | `Task/015` |
| Sesión administrativa en el frontend | `Task/015` |
| SEO: `description`, Open Graph, canonical, sitemap, `robots` | `Task/016` |
| Semilla local de perfil y contenido | `Task/022` |
| Despliegue en Cloudflare Pages | `Task/034`, `Task/037` |

Estado vigente del proyecto:
[`personal-blog-infra/docs/project-management/STATUS.md`](../personal-blog-infra/docs/project-management/STATUS.md)

## 3.1 Sistema de diseño

Desde `Task/013`. **Sin dependencias de terceros**: CSS Modules —nativos de Vite— y CSS
Custom Properties.

```ts
import { Badge, Button, Card, Container, Stack } from './components';
import { EmptyState, ErrorState, ExternalLink, LoadingState, Pagination } from './components';
```

| Pieza | Dónde | Regla |
| --- | --- | --- |
| Tokens | `src/styles/tokens.css` | Única fuente de color, tipografía, espaciado, forma, layout, foco y movimiento. |
| Fundación | `src/styles/foundation.css` | Defaults del documento y **estrategia única de foco visible**. |
| Primitivas (`Task/013`) | `src/components/` | `Container`, `Stack`, `Button`, `Card`, `Badge`. |
| Compartidos (`Task/014`) | `src/components/` | `Pagination`, `ExternalLink`, `LoadingState`, `EmptyState`, `ErrorState`. |
| Superficie pública | `src/components/index.ts` | Punto de entrada previsto; no se importan archivos internos. |

Reglas que la suite hace cumplir automáticamente sobre **todo** CSS Module del árbol
(`src/styles/designSystem.guards.test.ts`):

- Ninguna hoja define un color propio: todos vienen de los tokens.
- Ningún `var(--…)` apunta a un token inexistente.
- Ningún CSS suprime el `outline` ni redefine el foco por su cuenta.
- Las primitivas no usan media queries de ancho; fuera de ellas solo se admiten citando el
  breakpoint canónico de `tokens.css`. Hoy no existe ninguna: el responsive es intrínseco.

El contraste de la paleta se verifica con ratios reales en `src/styles/contrast.test.ts`.

### Ver el sistema en el navegador

Con el servidor de desarrollo en marcha, `/__design-system` muestra tokens, tipografía,
espaciado y primitivas. **Existe solo en desarrollo**: la ruta y su página no forman
parte del build de producción.

## 3.2 Sitio público

| Ruta | Página | API |
| --- | --- | --- |
| `/` | Inicio: presentación y destacados de cada tipo | `profile`, listados con `featured=true&page_size=3` |
| `/quien-soy` | Perfil con biografía Markdown | `profile` |
| `/articulos`, `/articulos/:slug` | Listado paginado y detalle | `posts` |
| `/reviews`, `/reviews/:slug` | Listado paginado y detalle | `book-reviews` |
| `/videos` | Listado; *embed* bajo demanda de `youtube` y `vimeo` | `videos` |
| `/proyectos`, `/proyectos/:slug` | Listado paginado y detalle | `projects` |
| `/contacto` | Correo y redes | `profile` |
| `/buscar?q=` | Resultados planos con tipo | `search` |
| cualquier otra | Página 404 dentro del layout | — |

Reglas que el sitio cumple y la suite fija:

- Solo se consumen los diez recursos públicos; nunca `/api/v1/admin/*`.
- El estado del listado vive en la URL: `?page=`, `?tag=`, `?q=`. No se reenvía ningún
  otro parámetro al API (el backend rechaza los desconocidos con `422`).
- Las imágenes se renderizan **solo** con `access_url` del contrato, con su `alt_text`,
  `width` y `height`. Nunca se construye una URL hacia el almacenamiento.
- El Markdown se renderiza con `react-markdown` + `rehype-sanitize`, sin HTML crudo y sin
  `innerHTML`. `MarkdownContent` es el pipeline que la vista previa de `Task/015` debe
  reutilizar.
- Los enlaces externos pasan por `ExternalLink`: `rel="noopener noreferrer"`, misma
  pestaña, solo `http`/`https`.
- Un `404` del API por slug muestra la misma página 404; el `404` de `GET /profile`
  —sin semilla local— es «perfil aún no disponible», no un error.

---

## 4. Stack

| Pieza | Elección |
| --- | --- |
| Framework | React 19 |
| Lenguaje | TypeScript 5.9, modo estricto |
| Build y dev server | Vite 8 |
| Enrutado | React Router 8, en modo declarativo por datos |
| Render Markdown | `react-markdown` 10 + `rehype-sanitize` 6 (ADR-005) |
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

No hace falta Docker para ejecutar la suite: ninguna prueba toca la red. Para ver el sitio
con datos reales hace falta el entorno local de `personal-blog-infra` (`Task/007`), que
sirve sitio y API en el **mismo origen** tras Traefik; el backend no tiene CORS hasta
`Task/018`, así que el servidor de desarrollo de Vite (`5173`) no puede consumir el API
por su cuenta. El flujo documentado es reconstruir la imagen del frontend:

```powershell
# En personal-blog-infra
docker compose build frontend
docker compose up -d frontend
```

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
**El build también la exige**: Vite la incrusta en el bundle.

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
├── app/          Composición global: raíz, router, layout del sitio y contextos.
├── pages/        Una pantalla por ruta. Ensamblan, no implementan.
├── features/     Funcionalidades completas: render Markdown sanitizado.
├── entities/     Componentes ligados al dominio: tarjetas, imagen, etiquetas, video.
├── components/   Sistema de diseño: primitivas y compartidos, sin dominio ni HTTP.
├── services/     Única capa que habla HTTP: cliente común y adaptadores públicos.
├── hooks/        Comportamiento reutilizable: recurso asíncrono, título, parámetros.
├── lib/          Utilidades puras y sin estado: configuración, rutas, formato, enlaces.
├── styles/       Tokens de diseño y estilos globales.
├── test/         Preparación común de la suite, fixtures y respuestas falsas del API.
└── main.tsx      Punto de entrada.
```

Las dependencias entre carpetas siguen
[`software-architecture.md`](../personal-blog-infra/docs/architecture/software-architecture.md),
sección 4.3: `pages → features → entities → components`; solo `services` habla HTTP;
`components` no conoce el dominio. `assets/` no existe todavía: una carpeta vacía no
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
> hosting estático (`Task/034`) tendrán que hacer lo mismo. Por eso la página 404 no
> puede responder con código HTTP `404` desde el frontend: ese punto es de `Task/016` y
> `Task/034`.

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

`Task/015`, `Task/019`, `Task/037`, y participación en `Task/016`, `Task/018`,
`Task/022`, `Task/034`, `Task/036`, `Task/040`.

`Task/006`, `Task/007`, `Task/013` y `Task/014` ya están entregadas en este repositorio.

## 14. Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
