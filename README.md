# personal-blog-frontend

Interfaz del blog personal. **React + TypeScript + Vite.**

> **La implementación todavía no ha comenzado.**
> Este repositorio contiene únicamente archivos base de configuración y documentación.
> No hay código React, ni componentes, ni `package.json`.

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

## 3. Estado actual

| Campo | Valor |
| --- | --- |
| **Fase** | ETAPA 02 — Fundaciones de las Aplicaciones (**en curso**) |
| **Implementación** | No iniciada |
| **Primera tarea de este repositorio** | `Task/006-Fundacion-Frontend-React` (Etapa 02) |
| **Ramas** | `main`, `dev` |
| **Rama activa** | `main` |

Estado vigente del proyecto:
[`personal-blog-infra/docs/project-management/STATUS.md`](../personal-blog-infra/docs/project-management/STATUS.md)

## 4. Arquitectura general (resumen)

| Entorno | Cómo se sirve este frontend |
| --- | --- |
| **Local** | Build de Vite servido tras un reverse proxy local, consumiendo el API de FastAPI. Orquestado con Docker Compose y supervisado con Portainer CE. |
| **Nube** | Estáticos publicados en Cloudflare Pages, consumiendo el API expuesto por API Gateway HTTP API sobre AWS Lambda. |

El mismo build sirve para ambos entornos: la URL del API se inyecta como variable de
entorno en tiempo de build. Detalle completo en
[`personal-blog-infra/docs/architecture/local-to-cloud-mapping.md`](../personal-blog-infra/docs/architecture/local-to-cloud-mapping.md).

## 5. Estrategia de ramas

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

> El trabajo de `Task/001` se fusionó en `main` mediante el pull request `#1`; `main` y
> `dev` tienen el mismo contenido. La rama `Task/001` ya no existe.

## 6. Fuente de verdad de la planificación

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

## 7. Tareas previstas para este repositorio

`Task/006`, `Task/013`, `Task/014`, `Task/015`, `Task/019`, `Task/037`, y participación
en `Task/007`, `Task/016`, `Task/018`, `Task/022`, `Task/034`, `Task/036`, `Task/040`.

## 8. Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
