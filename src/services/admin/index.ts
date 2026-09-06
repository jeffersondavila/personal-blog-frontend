/**
 * Superficie publica de la capa administrativa.
 *
 * El resto del panel importa desde aqui —no de los archivos internos— para que
 * la organizacion de la carpeta pueda cambiar sin tocar a sus consumidores, y
 * para que exista **un solo sitio** donde comprobar que ningun adaptador se
 * salta `credentials: 'include'`.
 */
export { BASE_ADMIN, consultaAdmin, listarAdmin, pedirAdmin } from './cliente';
export type { ParametrosAdmin } from './cliente';

export { cerrarSesion, iniciarSesion, sesionActual } from './auth';
export type { Credenciales } from './auth';

export {
  actualizar,
  crear,
  listar,
  obtener,
  transicionar,
  transicionesDisponibles,
} from './contenido';
export type { RecursoDeContenido, Transicion } from './contenido';
export { ARTICULOS, PROYECTOS, RECURSOS_PUBLICABLES, REVIEWS, VIDEOS } from './recursos';

export { crearEtiqueta, eliminarEtiqueta, listarEtiquetas, renombrarEtiqueta } from './tags';
export { guardarPerfil, obtenerPerfil } from './perfil';
export {
  TAMANO_MAXIMO_BYTES,
  TIPOS_ADMITIDOS,
  cargarMedio,
  eliminarMedio,
  listarMedios,
} from './media';
export { listarEventosDeAuditoria } from './auditoria';

export type * from './types';
