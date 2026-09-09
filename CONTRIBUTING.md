# Guía de contribución — personal-blog-frontend

> Las reglas de esta guía están vigentes: la fundación del frontend existe desde
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
3. Crea la rama `Task/<numero>-<nombre>` **desde `main`** actualizado y limpio.
   **Nunca desde `dev`**
   ([WORKFLOW §2.1](../personal-blog-infra/docs/project-management/WORKFLOW.md)).
4. Implementa **solo** el alcance de la tarea.
5. Ejecuta las validaciones.
6. Marca la tarea `Lista para validación` y espera al usuario.

La aprobación es exclusiva del usuario mediante `approved: Task/<nombre-de-rama>`.
Sin ella no se hace commit, merge, push ni pull request.

---

## 3. Estrategia de ramas

| Rama | Propósito |
| --- | --- |
| `main` | Versión estable o liberable. **Única base permitida de las ramas Task.** |
| `dev` | **Solo integración** de tareas aprobadas. **Nunca base de una Task.** |
| `Task/<numero>-<nombre>` | Trabajo aislado de una tarea, creado **desde `main`**. |

> **Invariante crítico:** toda rama `Task/<...>` nace desde `main` actualizado y limpio.
> `dev` nunca es base de una Task. Motivo y validaciones:
> [WORKFLOW §2.1](../personal-blog-infra/docs/project-management/WORKFLOW.md).

Si la tarea también toca backend o infraestructura, se usa **el mismo nombre de rama**
en esos repositorios, y **todas nacen de `main`**.

---

## 4. Convención de commits

```
<tipo>(<ámbito>): <descripción en imperativo>

Task/<numero>-<nombre>
```

Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `style`, `perf`.

---

## 5. Estándares de código

| Aspecto | Herramienta / regla |
| --- | --- |
| Lenguaje | TypeScript 5.9 en modo estricto |
| Lint | ESLint 10 con `typescript-eslint`, reglas que consultan tipos |
| Formato | Prettier 3 |
| Pruebas | Vitest 4 + Testing Library + jsdom |
| Longitud de línea | 100 caracteres |
| Indentación | 2 espacios |
| Fin de línea | LF |
| Comillas | Simples en TypeScript/JavaScript |

El reparto entre las dos herramientas es deliberado: **ESLint juzga corrección**
—reglas de React, de los hooks y del sistema de tipos— y **Prettier juzga formato**.
`eslint-config-prettier` desactiva en ESLint toda regla de formato, de modo que nunca
hay dos veredictos contradictorios sobre el mismo archivo.

Prettier **no formatea Markdown** a propósito: los tres repositorios comparten un estilo
de documentación escrito a mano, y aplicarlo solo aquí dejaría este repositorio con un
estilo distinto sin que nadie lo haya decidido. El motivo está en `.prettierignore`.

### Comandos

| Comando | Qué comprueba |
| --- | --- |
| `npm run lint` | Corrección: React, hooks y tipos. |
| `npm run typecheck` | Tipos, sin generar nada. |
| `npm run format:check` | Formato, sin modificar nada. |
| `npm run test:run` | Suite completa, una pasada. |
| `npm run build` | Tipos y build de producción. |

Antes de marcar una tarea como lista, los cinco deben terminar sin errores.

### Integración continua

[CI Frontend](.github/workflows/ci-frontend.yml) ejecuta esos gates y `npm audit`
en cada `push` y `pull_request`, sin filtros de ramas ni rutas. Un único job en
Ubuntu 24.04 instala con `npm ci`, comprueba formato, lint y tipos, construye,
ejecuta la suite canónica y audita las dependencias. **El build precede a los
tests** para que las guardas SEO y P-05 comprueben `dist/` y no se omitan.

El runtime es **Node 22.23.2**, el mismo parche del builder del Dockerfile; se usa
el npm incluido. Para reproducirlo localmente:

```powershell
npm ci
npm run format:check
npm run lint
npm run typecheck
$env:VITE_API_BASE_URL = 'https://api.example.test'
$env:VITE_SITE_BASE_URL = 'https://example.test'
npm run build
npm run test:run
npm audit
```

Los dos orígenes son ficticios y públicos. El build conserva la validación
*fail-closed*; no requiere backend, Docker, servicios de datos ni credenciales.
No se publican los artefactos generados. `npm audit` incluye dependencias de
desarrollo y producción y conserva su fallo predeterminado ante cualquier
vulnerabilidad; también falla ante un error de consulta. Es la automatización
del comando verificado en Task018 para **S-09**, sin excepciones ni umbral nuevo.

Las dos acciones oficiales se fijan por SHA de commit, con su versión en un
comentario. Al actualizarlas se revisan las notas de versión y se vuelve a
validar CI. El token tiene `contents: read` y checkout no persiste credenciales.
La caché de setup-node guarda la caché de npm, con clave derivada del lockfile;
no guarda `node_modules`, builds ni secretos. Cada ejecución tiene un límite
de **10 minutos**. La concurrencia agrupa por workflow, evento y referencia:
una ejecución nueva cancela solo la obsoleta de ese mismo grupo.

Los tests conservan sus timeouts y paralelismo. Cualquier fallo intermitente se
investiga como defecto, con evidencia; no se oculta cambiando esos parámetros.
El escaneo del historial de secretos corresponde a **Task021** y al cierre
global de ETAPA 06. Esta CI no despliega ni configura protecciones de ramas.

`vite.config.test.ts` carga la configuración real con el loader vigente y
comprueba que Vite no detecte incompatibilidades con su futuro loader nativo.
Los imports `.ts` explícitos se permiten solo en el proyecto TypeScript de
configuración, que tiene `noEmit`; el loader de producción sigue siendo el
predeterminado de Vite.

### Reglas de pruebas

- Las pruebas viven **junto al archivo que prueban** (`env.ts` y `env.test.ts`).
- **Ninguna prueba toca la red.** `fetch` se inyecta en el cliente HTTP; no se
  reemplaza el `fetch` global.
- **Ninguna prueba depende del `.env` de quien la ejecute.** La configuración se recibe
  como argumento, nunca se lee de `import.meta.env` dentro de una prueba.
- **Ninguna prueba depende del orden.** Mocks, globales y DOM se limpian después de cada
  una; esa limpieza está configurada en `vite.config.ts` y `src/test/setup.ts`.
- Una corrección de defecto empieza por la prueba que lo reproduce, y esa prueba se
  queda en la suite.

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
