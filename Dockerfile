# ---------------------------------------------------------------------------
# personal-blog-frontend — imagen del entorno LOCAL (Task/007)
#
# Esta imagen existe unicamente para servir el sitio en el Docker Compose local
# detras de Traefik v3. NO es el destino de produccion: en produccion el mismo
# `dist/` lo publica Cloudflare Pages (`Task/034`), sin contenedor y sin
# servidor propio (ADR-003, target-production-architecture.md seccion 18).
#
# El artefacto que se construye aqui es exactamente el mismo `dist/` estatico
# que produce `npm run build` (requisito T-05). El contenedor solo aporta el
# servidor de archivos; nada del contenido depende de el.
#
# Construccion (desde la raiz del repositorio):
#   docker build -t personal-blog-frontend:local .
#
# La URL del API se fija en tiempo de BUILD porque Vite la incrusta en el
# bundle. No es un secreto: toda variable `VITE_*` es publica por construccion
# (CONTRIBUTING.md, seccion 7).
# ---------------------------------------------------------------------------

# Version de parche explicita: `22-alpine` es una etiqueta movil que cambiaria
# sin aviso (misma regla que el Compose de infra y el Dockerfile del backend).
FROM node:22.21.1-alpine AS builder

ENV CI=true

WORKDIR /build

# Solo el manifiesto y el lockfile: una capa que se reaprovecha mientras las
# dependencias no cambien.
COPY package.json package-lock.json ./

# `npm ci` y no `npm install`: instala exactamente lo que fija el lockfile y
# falla si el manifiesto y el lockfile no coinciden. Es lo que hace el build
# reproducible que valido `Task/006`.
RUN npm ci

COPY . .

# Origen del API que se incrusta en el bundle. Su valor por defecto sirve para
# una construccion suelta; el Compose lo sobrescribe con la URL real de Traefik.
ARG VITE_API_BASE_URL=http://localhost:8081
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Origen publico del SITIO, anadido por `Task/016`. No es el del API: lo consumen
# `canonical` (E-04) y `og:url` (E-03), que necesitan URL absolutas del sitio.
#
# En local coinciden porque Traefik sirve sitio y API en el mismo origen. En
# produccion NO coinciden (D-15), y el valor real lo fijaran `Task/034` y
# `Task/035` cuando D-07 se resuelva.
#
# El Compose de `personal-blog-infra` lo pasa explicitamente desde
# `TRAEFIK_HTTP_HOST_PORT`, igual que VITE_API_BASE_URL. Este valor por defecto
# solo sirve para una construccion suelta, fuera del Compose.
ARG VITE_SITE_BASE_URL=http://localhost:8081
ENV VITE_SITE_BASE_URL=${VITE_SITE_BASE_URL}

RUN npm run build

# ---------------------------------------------------------------------------
# Imagen final — servidor de archivos estaticos
#
# Nginx aqui NO es un reverse proxy ni enruta nada: Traefik es el unico proxy
# del entorno (D-05). Su unica funcion es servir `dist/` y resolver el
# *fallback* de la SPA, que Traefik no puede hacer: cualquier ruta del router
# de React debe devolver `index.html` en lugar de 404.
#
# Es el equivalente local de lo que Cloudflare Pages hace por su cuenta en
# produccion.
# ---------------------------------------------------------------------------
FROM nginx:1.29.3-alpine AS runtime

# La imagen base trae una configuracion por defecto que no hace el *fallback*
# de la SPA. Se sustituye por la del proyecto.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 8080

# Sonda de vivacidad con `wget`, incluido en la imagen alpine de nginx: no hace
# falta anadir ninguna herramienta extra.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --spider --tries=1 http://127.0.0.1:8080/ || exit 1
