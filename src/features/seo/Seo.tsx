/**
 * Metadatos SEO de una superficie publica (`Task/016`).
 *
 * Cubre **E-02** (`title` y `description`), **E-03** (Open Graph), **E-04**
 * (`canonical`), la mitad de marcado de **E-06** (`meta robots`) y **E-07**
 * (JSON-LD).
 *
 * Sin dependencias nuevas
 * -----------------------
 *
 * React 19 iza `<title>`, `<meta>` y `<link rel>` al `<head>` de forma **nativa**
 * —comprobado al medir el *baseline* de esta tarea—, asi que `react-helmet` y
 * `react-helmet-async` son innecesarios. Anadir una de esas bibliotecas seria
 * peso y mantenimiento a cambio de nada, y contradiria **M-06**.
 *
 * El `<script type="application/ld+json">` **no** se iza y permanece en el
 * `<body>`, donde `application/ld+json` es igualmente valido. Se documenta como
 * hecho medido, no como suposicion.
 *
 * Limitacion estructural que este componente NO resuelve
 * -----------------------------------------------------
 *
 * Todo esto existe **despues** de hidratar. Un *crawler* que no ejecuta
 * JavaScript recibe `index.html` y no ve ninguna de estas etiquetas. Es el
 * bloqueo **B-016-2** de la ficha, y no se arregla escribiendo mejor este
 * componente: exige reconsiderar la estrategia de *rendering*, que es una
 * decision nueva con su propio ADR (**D-21** / **ADR-009**, en estado
 * Propuesta).
 *
 * Por que el titulo sigue pasando por `useDocumentTitle`
 * ------------------------------------------------------
 *
 * `Task/014` lo entrego como propiedad **de accesibilidad** (WCAG 2.4.2) y lo
 * dejo probado. Mantener **un solo** mecanismo evita que un `<title>` izado y un
 * efecto se peleen por `document.title`. Aqui se reutiliza, y de la misma cadena
 * se deriva `og:title`, de modo que no puedan divergir.
 */
import { useDocumentTitle, tituloDelDocumento } from '../../hooks/useDocumentTitle';
import { useAppConfig } from '../../app/appConfigContext';
import { urlAbsoluta } from './metadatos';

/** Tipos de Open Graph que este sitio usa. */
export type TipoOpenGraph = 'website' | 'article' | 'profile';

export interface SeoProps {
  /**
   * Titulo propio de la pagina, sin el nombre del sitio.
   *
   * Misma semantica que `useDocumentTitle`, que `Task/014` fijo:
   * - una cadena, el titulo de la pagina;
   * - `null`, solo el nombre del sitio (la portada);
   * - `undefined`, **delegar**: la pagina no fija metadatos porque otro
   *   componente que ella monta lo hace —una pagina de detalle que renderiza la
   *   404 cuando el API responde `404`—. En ese caso **no se emite nada**.
   */
  readonly titulo: string | null | undefined;

  /** Descripcion propia de la pagina (**E-02**). */
  readonly descripcion: string;

  /** Ruta canonica. La consulta y el fragmento se descartan (**E-04**). */
  readonly ruta: string;

  /** Tipo de Open Graph. `website` salvo detalles (`article`) y perfil. */
  readonly tipo?: TipoOpenGraph;

  /**
   * `false` emite `noindex,follow` y **no** emite `canonical` (**E-06**).
   *
   * `follow` y no `nofollow`: se pide no indexar **esta** pagina, no dejar de
   * seguir los enlaces que lleva hacia paginas que si deben indexarse.
   */
  readonly indexable?: boolean;

  /** Esquemas JSON-LD ya construidos (**E-07**). Vacio significa ninguno. */
  readonly jsonLd?: readonly Record<string, unknown>[];
}

export function Seo({
  titulo,
  descripcion,
  ruta,
  tipo = 'website',
  indexable = true,
  jsonLd = [],
}: SeoProps) {
  const { siteBaseUrl } = useAppConfig();

  useDocumentTitle(titulo);

  // `undefined` significa delegar: quien monte la 404 pondra sus metadatos.
  // Emitir aqui los de la pagina que no se pudo cargar declararia canonica una
  // URL que responde con contenido de error.
  if (titulo === undefined) {
    return null;
  }

  const canonical = urlAbsoluta(siteBaseUrl, ruta);
  const tituloCompleto = tituloDelDocumento(titulo);

  return (
    <>
      <meta name="description" content={descripcion} />
      {indexable ? (
        <link rel="canonical" href={canonical} />
      ) : (
        <meta name="robots" content="noindex,follow" />
      )}

      {/* Solo lo que CAMBIA por pagina. `og:site_name`, `og:image` y
          `twitter:card` viven en `index.html` porque valen para todo el sitio y
          asi los ve tambien un *crawler* sin JavaScript. Emitirlos aqui ademas
          produciria duplicados: React 19 iza los metadatos pero no deduplica,
          comprobado al implementar esta tarea. */}
      <meta property="og:type" content={tipo} />
      <meta property="og:title" content={tituloCompleto} />
      <meta property="og:description" content={descripcion} />
      <meta property="og:url" content={canonical} />

      {jsonLd.map((esquema, indice) => (
        <script
          // La clave es el indice porque la lista es fija por pagina y sus
          // elementos no se reordenan ni se filtran.
          key={indice}
          type="application/ld+json"
          // `dangerouslySetInnerHTML` es la unica via para el contenido de un
          // `<script>` en React. El valor **no** es HTML de usuario: es el
          // resultado de `JSON.stringify` sobre un objeto que construye este
          // proyecto, y `<` se escapa para que no pueda cerrar la etiqueta.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ '@context': 'https://schema.org', ...esquema }).replace(
              /</g,
              '\\u003c',
            ),
          }}
        />
      ))}
    </>
  );
}
