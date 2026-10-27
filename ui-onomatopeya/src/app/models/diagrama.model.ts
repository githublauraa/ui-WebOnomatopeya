import { Proceso } from './proceso.model';

export interface Diagrama {
  proceso: Proceso;
  pools: Pool[];
  lanes: Lane[];
  nodos: Nodo[];
  arcos: Arco[];
  mensajes: MensajeDetalle[];
  flujos: FlujoMensaje[];
  advertencias: string[];
}

export interface Pool {
  id: number;
  nombre: string;
  tipoParticipante: string;
  propietario: boolean;
  cajaNegra: boolean;
  posicionX: number | null;
  posicionY: number | null;
  ancho: number | null;
  alto: number | null;
  orden: number;
  version: number;
}

export interface Lane {
  id: number;
  poolId: number;
  rolProcesoId: number | null;
  nombre: string;
  orden: number;
  altura: number | null;
  version: number;
}

export interface Nodo {
  id: number;
  clase: string;
  poolId: number;
  nombre: string;
  posicionX: number | null;
  posicionY: number | null;
  ancho: number | null;
  alto: number | null;
  estado: string;
  laneId: number | null;
  tipoActividad: string | null;
  tipoGateway: string | null;
  direccionGateway: string | null;
  tipoEvento: string | null;
  naturalezaEvento: string | null;
  operacionMensaje: string | null;
}

export interface Arco {
  id: number;
  poolId: number;
  origenId: number;
  destinoId: number;
  etiqueta: string | null;
  condicionSalida: string | null;
}

export interface MensajeDetalle {
  mensaje: Mensaje;
  campos: CampoMensaje[];
  usos: UsoMensajeActividad[];
}

export interface Mensaje {
  id: number;
  nodoId: number;
  sentido: string;
  nombre: string;
  origenExterno: boolean;
  correlacionTipo: string | null;
  correlacionNegocio: string | null;
  correlacionCampoId: number | null;
  politicaSinCorrespondencia: string | null;
  activo: boolean;
  version: number;
}

export interface CampoMensaje {
  id: number;
  mensajeId: number;
  nombre: string;
  tipoDato: string;
  orden: number;
  activo: boolean;
  version: number;
}

export interface UsoMensajeActividad {
  id: number;
  mensajeId: number;
  actividadId: number;
  activo: boolean;
  version: number;
}

export interface FlujoMensaje {
  id: number;
  procesoId: number;
  poolOrigenId: number;
  poolDestinoId: number | null;
  nodoOrigenId: number;
  nodoDestinoId: number | null;
  tipoDestino: string | null;
  politicaFallo: string | null;
  actividadErrorId: number | null;
  activo: boolean;
  version: number;
}
