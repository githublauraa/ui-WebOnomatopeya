import { Proceso } from './proceso.model';

export type TipoParticipante = 'EMPRESA' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';
export type ClaseNodo = 'ACTIVIDAD' | 'GATEWAY' | 'EVENTO';
export type TipoActividad = 'TAREA' | 'ENVIO';
export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';
export type DireccionGateway = 'DIVERGENCIA' | 'CONVERGENCIA';
export type TipoEvento = 'INICIO' | 'INTERMEDIO' | 'FIN';
export type NaturalezaEvento = 'NORMAL' | 'MENSAJE';
export type OperacionEventoMensaje = 'ENVIO' | 'RECEPCION';

export interface PoolDatosBase {
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra: boolean;
  posicionX: number;
  posicionY: number;
  ancho: number;
  alto: number;
  orden: number;
}

/** procesoId viaja en la URL al crear. */
export type PoolCrearDatos = PoolDatosBase;

/** Al editar, la API exige la versión consultada del pool. */
export interface PoolEditarDatos extends PoolDatosBase {
  version: number;
}

export interface LaneDatosBase {
  rolProcesoId: number;
  orden: number;
  altura: number;
}

/** procesoId y poolId viajan en la URL al crear. */
export type LaneCrearDatos = LaneDatosBase;

export interface LaneEditarDatos extends LaneDatosBase {
  version: number;
}

interface NodoDatosBase {
  poolId: number;
  nombre: string;
  posicionX: number;
  posicionY: number;
  ancho: number;
  alto: number;
}

export interface ActividadNodoDatos extends NodoDatosBase {
  clase: 'ACTIVIDAD';
  laneId: number;
  tipoActividad: TipoActividad;
}

export interface GatewayNodoDatos extends NodoDatosBase {
  clase: 'GATEWAY';
  tipoGateway: TipoGateway;
  direccionGateway: DireccionGateway;
}

export interface EventoNormalNodoDatos extends NodoDatosBase {
  clase: 'EVENTO';
  tipoEvento: TipoEvento;
  naturalezaEvento: 'NORMAL';
  operacionMensaje?: never;
}

export interface EventoMensajeNodoDatos extends NodoDatosBase {
  clase: 'EVENTO';
  tipoEvento: TipoEvento;
  naturalezaEvento: 'MENSAJE';
  operacionMensaje: OperacionEventoMensaje;
}

/** NodoDatos es una unión: cada clase obliga sus campos condicionales. */
export type NodoDatos =
  | ActividadNodoDatos
  | GatewayNodoDatos
  | EventoNormalNodoDatos
  | EventoMensajeNodoDatos;

/** procesoId va en la URL; el arco se define por los nodos que conecta. */
export interface ArcoDatos {
  origenId: number;
  destinoId: number;
  etiqueta?: string | null;
  condicionSalida?: string | null;
}

export interface RetiradaDatos {
  version: number;
  confirmar: true;
}

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
