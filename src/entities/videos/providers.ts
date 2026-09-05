/**
 * Lista cerrada de proveedores de video (decision D-014-C).
 *
 * CONTENT_MODEL seccion 3.4 dice que *«los proveedores permitidos se
 * restringen para acotar los embeds; la lista se cierra en Task/014»*, y
 * security-boundaries seccion 5 registra el riesgo: *«contenido de terceros no
 * controlado»*. La lista inicial es **YouTube** —el unico ejemplo que las
 * fuentes nombran— y **Vimeo**.
 *
 * Todo lo demas es *fail-closed*: un proveedor fuera de la lista, o una
 * referencia que no cumpla el patron esperado, **no produce ningun `iframe`**.
 * La URL del embed se construye aqui a partir de la referencia validada, nunca
 * a partir de una URL que venga del API: un dato que viaja por la red es un
 * dato, no un destino en el que confiar.
 *
 * El backend acepta cualquier cadena en `provider` (exige presencia, no
 * pertenencia). Restringirlo alli y ofrecer el selector en el panel queda como
 * deuda registrada en la ficha.
 */

export interface ProveedorDeVideo {
  /** Nombre visible, para el enlace externo («Ver en YouTube»). */
  readonly nombre: string;
  /** Forma exacta que debe tener `embed_reference`. */
  readonly patron: RegExp;
  readonly urlDeEmbed: (referencia: string) => string;
}

const PROVEEDORES: Readonly<Record<string, ProveedorDeVideo>> = {
  youtube: {
    nombre: 'YouTube',
    patron: /^[A-Za-z0-9_-]{11}$/,
    // El dominio sin cookies no registra al visitante hasta que reproduce.
    urlDeEmbed: (id) => `https://www.youtube-nocookie.com/embed/${id}`,
  },
  vimeo: {
    nombre: 'Vimeo',
    patron: /^[0-9]{6,12}$/,
    urlDeEmbed: (id) => `https://player.vimeo.com/video/${id}`,
  },
};

export const PROVEEDORES_PERMITIDOS: ReadonlySet<string> = new Set(Object.keys(PROVEEDORES));

function normalizar(proveedor: string | null | undefined): string {
  return (proveedor ?? '').trim().toLowerCase();
}

/** Nombre visible del proveedor, o `null` si no esta en la lista. */
export function nombreDeProveedor(proveedor: string | null | undefined): string | null {
  return PROVEEDORES[normalizar(proveedor)]?.nombre ?? null;
}

/**
 * URL del embed, o `null` si el proveedor no esta permitido o la referencia
 * no tiene la forma exacta que ese proveedor exige.
 */
export function urlDeEmbed(
  proveedor: string | null | undefined,
  referencia: string | null | undefined,
): string | null {
  const definicion = PROVEEDORES[normalizar(proveedor)];
  if (definicion === undefined || referencia === null || referencia === undefined) {
    return null;
  }
  const limpia = referencia.trim();
  if (!definicion.patron.test(limpia)) {
    return null;
  }
  return definicion.urlDeEmbed(limpia);
}
