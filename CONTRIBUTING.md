# Guía de contribución — personal-blog-frontend

> La implementación aún no ha comenzado. Esta guía fija las reglas que aplicarán desde
> `Task/006-Fundacion-Frontend-React`.

---

## 1. Alcance del repositorio

Se acepta aquí: sitio público, panel administrativo, sistema de diseño, cliente HTTP,
estilos, metadatos SEO del lado del cliente, pruebas de interfaz y configuración de build.

**No** se acepta: lógica de dominio, acceso a base de datos, autenticación del lado
servidor, Docker Compose del entorno, Terraform ni documentación de planificación.

---

## 2. Flujo de trabajo

El proceso completo está en
[`personal-blog-infra/docs/project-management/WORKFLOW.md`](../personal-blog-infra/docs/project-management/WORKFLOW.md).
Resumen:

1. Selecciona una tarea `Pendiente` en `STATUS.md`.
2. Verifica que sus dependencias estén `Aprobada`.
3. Crea la rama `Task/<numero>-<nombre>` **desde `dev`**.
4. Implementa **solo** el alcance de la tarea.
5. Ejecuta las validaciones.
6. Marca la tarea `Lista para validación` y espera al usuario.

La aprobación es exclusiva del usuario mediante `approved: Task/<nombre-de-rama>`.
Sin ella no se hace commit, merge, push ni pull request.

---

## 3. Estrategia de ramas

| Rama | Propósito |
| --- | --- |
| `main` | Versión estable o liberable. |
| `dev` | Integración de tareas aprobadas. |
| `Task/<numero>-<nombre>` | Trabajo aislado de una tarea, creado desde `dev`. |

Si la tarea también toca backend o infraestructura, se usa **el mismo nombre de rama**
en esos repositorios.

---

## 4. Convención de commits

```
<tipo>(<ámbito>): <descripción en imperativo>

Task/<numero>-<nombre>
```

Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `style`, `perf`.

---

## 5. Estándares de código (a partir de `Task/006`)

| Aspecto | Herramienta / regla |
| --- | --- |
| Lenguaje | TypeScript en modo estricto |
| Lint y formato | Se fijan en `Task/006` |
| Pruebas | Se fijan en `Task/006` |
| Longitud de línea | 100 caracteres |
| Indentación | 2 espacios |
| Fin de línea | LF |
| Comillas | Simples en TypeScript/JavaScript |

Antes de marcar una tarea como lista: lint, type-check, tests y build de producción,
todos sin errores.

---

## 6. Reglas de diseño

- **Todo componente nace del sistema de diseño** (`Task/013`): nada de estilos sueltos
  ni valores mágicos de color, espaciado o tipografía.
- **El sitio público y el panel comparten el mismo sistema de diseño.**
- **Responsive obligatorio**: móvil, tableta y escritorio.
- **Accesibilidad base**: navegación por teclado, foco visible, contraste suficiente y
  texto alternativo en imágenes.
- **Todo acceso al API pasa por el cliente HTTP común**, con manejo uniforme de errores.
- **El contenido Markdown se sanitiza antes de renderizarse.**
- **La URL del API se inyecta por variable de entorno**, nunca se incrusta en el código.

---

## 7. Reglas de seguridad

- Nunca se versionan secretos, tokens ni archivos `.env` reales.
- Toda variable de entorno se documenta en `.env.example` con un valor ficticio.
- Recuerda que **cualquier valor en el build del frontend es público**: no debe contener
  nada sensible.
- Las rutas administrativas exigen sesión válida verificada contra el backend; ocultar
  la interfaz no es control de acceso.

---

## 8. Antes de marcar una tarea como lista

Revisa
[`DEFINITION_OF_DONE.md`](../personal-blog-infra/docs/project-management/DEFINITION_OF_DONE.md),
sección *Tareas de frontend*.
