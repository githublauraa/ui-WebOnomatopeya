export type RolEstructura = 'ADMINISTRADOR' | 'EDITOR' | 'LECTURA';
export type RecursoEstructura = 'POOL' | 'LANE';
export type AccionEstructura = 'CREAR' | 'EDITAR' | 'RETIRAR';

export interface GuardarPermisoEstructura {
  rolAcceso: RolEstructura;
  recurso: RecursoEstructura;
  accion: AccionEstructura;
  permitido: boolean;
  version?: number;
}

export interface PermisoEstructura extends GuardarPermisoEstructura {
  id: number;
  procesoId: number;
  version: number;
}

export interface VerificacionPermiso {
  permitido: boolean;
}
