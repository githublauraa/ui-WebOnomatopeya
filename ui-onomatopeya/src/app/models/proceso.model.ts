export interface Proceso {
  id: number;
  empresaId: number;
  creadorId: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  estadoPublicacion: 'BORRADOR' | 'PUBLICADO';
  activo: boolean;
  fechaCreacion: string;
  version: number;
}

export type EditarProceso = Omit<Proceso,
  'id' | 'empresaId' | 'creadorId' | 'activo' | 'fechaCreacion'>;

export interface CrearProceso {
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  estadoPublicacion: 'BORRADOR';
}

export interface PaginaProcesos {
  contenido: Proceso[];
  pagina: number;
  tamanio: number;
  total: number;
  paginas: number;
}

export interface FiltrosProcesos {
  nombre: string;
  categoria: string;
  estado: '' | 'BORRADOR' | 'PUBLICADO';
  activo: boolean;
}

export interface CambioProceso {
  id: number;
  actorId: number | null;
  fecha: string;
  tipoObjeto: string;
  objetoId: number;
  accion: string;
  descripcion: string;
}
