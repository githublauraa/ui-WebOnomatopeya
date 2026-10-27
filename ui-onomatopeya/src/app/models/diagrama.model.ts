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
  tipoParticipante: 'EMPRESA' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';
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
  clase: 'ACTIVIDAD' | 'GATEWAY' | 'EVENTO';
  poolId: number;
  nombre: string;
  posicionX: number | null;
  posicionY: number | null;
  ancho: number | null;
  alto: number | null;
  estado: 'BORRADOR' | 'ACTIVO' | 'RETIRADO';
  laneId: number | null;
  tipoActividad: 'TAREA' | 'ENVIO' | null;
  tipoGateway: 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO' | null;
  direccionGateway: 'DIVERGENCIA' | 'CONVERGENCIA' | null;
  tipoEvento: 'INICIO' | 'INTERMEDIO' | 'FIN' | null;
  naturalezaEvento: 'NORMAL' | 'MENSAJE' | null;
  operacionMensaje: 'ENVIO' | 'RECEPCION' | null;
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
  sentido: 'ENVIO' | 'RECEPCION';
  nombre: string;
  origenExterno: boolean;
  correlacionTipo: 'NEGOCIO' | 'CAMPO' | null;
  correlacionNegocio: string | null;
  correlacionCampoId: number | null;
  politicaSinCorrespondencia: 'DESCARTAR' | 'INICIAR_CASO' | null;
  activo: boolean;
  version: number;
}

export interface CampoMensaje {
  id: number;
  mensajeId: number;
  nombre: string;
  tipoDato: 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'BOOLEANO' | 'FECHA' | 'FECHA_HORA';
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
  nodoOrigenId: number | null;
  nodoDestinoId: number | null;
  tipoDestino: 'CORREO' | 'SERVICIO_WEB' | 'COLA' | null;
  politicaFallo: 'CONTINUAR' | 'DERIVAR' | 'FINALIZAR' | null;
  actividadErrorId: number | null;
  activo: boolean;
  version: number;
}
