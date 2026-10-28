/** Rol funcional que puede ser responsable de una lane. */
export interface RolProceso {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  version: number;
  procesosEnUso: number[];
}

/** Respuesta paginada de GET /roles-proceso. */
export interface PaginaRolesProceso {
  contenido: RolProceso[];
  pagina: number;
  tamanio: number;
  total: number;
  paginas: number;
}
