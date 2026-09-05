/**
 * Precarga del renderizador Markdown para las pruebas.
 *
 * `MarkdownContent` carga `MarkdownRenderer` con `React.lazy`, y esa primera
 * importacion transforma en el momento toda la cadena de `react-markdown`
 * —micromark, mdast, hast—. En una maquina cargada esa transformacion tarda, y
 * esperarla con un limite convertia la suite en **inestable**: el mismo codigo
 * pasaba o fallaba segun lo ocupada que estuviera la maquina. Se observo una
 * corrida completa en rojo (63 s) entre cinco en verde (~33 s).
 *
 * Importar el modulo aqui, de forma **estatica**, lo deja resuelto en el
 * registro del archivo de prueba antes de renderizar: cuando `React.lazy` lo
 * pide, lo recibe del registro en lugar de transformarlo. No es un doble ni un
 * atajo —el renderizador que se ejercita es el **real**, con su sanitizacion—;
 * lo unico que desaparece es una latencia del entorno, que no es comportamiento
 * del componente.
 *
 * **La carga diferida de produccion no se toca**: es una propiedad del build y
 * se comprueba donde corresponde —`dist/` emite `MarkdownRenderer-*.js` como
 * *chunk* aparte—, no con un cronometro dentro de JSDOM.
 *
 * Se importa por su efecto:
 *
 * ```ts
 * import '../test/precargarMarkdown';
 * ```
 */
import '../features/markdown/MarkdownRenderer';
