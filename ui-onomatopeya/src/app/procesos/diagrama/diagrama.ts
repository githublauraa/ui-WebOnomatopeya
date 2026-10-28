import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Arco, Diagrama, DireccionGateway, FlujoMensaje, Lane, LaneCrearDatos, MensajeDetalle,
  Nodo, NodoDatos, OperacionEventoMensaje, Pool, PoolCrearDatos,
  TipoActividad, TipoEvento, TipoGateway
} from '../../models/diagrama.model';
import { mensajeDeError } from '../../models/error-response.model';
import { EditarProceso } from '../../models/proceso.model';
import { RolProceso } from '../../models/rol-proceso.model';
import { DiagramaService } from '../../services/diagrama.service';
import { ProcesoService } from '../../services/proceso.service';
import { RolProcesoService } from '../../services/rol-proceso.service';

@Component({
  selector: 'app-diagrama',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './diagrama.html',
  styleUrl: './diagrama.css'
})
export class DiagramaComponent implements OnInit {
  private ruta = inject(ActivatedRoute);
  private diagramaService = inject(DiagramaService);
  private procesoService = inject(ProcesoService);
  private rolProcesoService = inject(RolProcesoService);
  private cambios = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  diagrama?: Diagrama;
  cargando = true;
  error = '';
  editando = false;
  guardando = false;
  errorEdicion = '';
  errorPool = '';
  errorLane = '';
  aviso = '';
  creandoPool = false;
  guardandoPool = false;
  creandoLaneParaPoolId: number | null = null;
  guardandoLane = false;
  creandoNodoParaPoolId: number | null = null;
  guardandoNodo = false;
  cargandoRoles = false;
  roles: RolProceso[] = [];
  errorNodo = '';
  formulario = this.fb.nonNullable.group({
    descripcion: ['', Validators.maxLength(10000)]
  });
  formularioPool = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    tipoParticipante: ['EMPRESA', Validators.required],
    cajaNegra: false,
    posicionX: [0, [Validators.required, Validators.min(0)]],
    posicionY: [0, [Validators.required, Validators.min(0)]],
    ancho: [1000, [Validators.required, Validators.min(1)]],
    alto: [400, [Validators.required, Validators.min(1)]],
    orden: [1, [Validators.required, Validators.min(0)]]
  });
  formularioLane = this.fb.nonNullable.group({
    rolProcesoId: [0, [Validators.required, Validators.min(1)]],
    orden: [0, [Validators.required, Validators.min(0)]],
    altura: [200, [Validators.required, Validators.min(1)]]
  });
  formularioNodo = this.fb.nonNullable.group({
    clase: ['ACTIVIDAD', Validators.required],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    posicionX: [50, [Validators.required, Validators.min(0)]],
    posicionY: [80, [Validators.required, Validators.min(0)]],
    ancho: [140, [Validators.required, Validators.min(1)]],
    alto: [70, [Validators.required, Validators.min(1)]],
    laneId: [0],
    tipoActividad: ['TAREA'],
    tipoGateway: ['EXCLUSIVO'],
    direccionGateway: ['DIVERGENCIA'],
    tipoEvento: ['INICIO'],
    naturalezaEvento: ['NORMAL'],
    operacionMensaje: ['ENVIO']
  });

  ngOnInit(): void {
    const idProceso = Number(this.ruta.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idProceso) || idProceso <= 0) {
      this.error = 'No se recibió un identificador de proceso válido.';
      this.cargando = false;
      return;
    }

    this.cargarDiagrama(idProceso);
    this.cargarRoles();
  }

  cargarDiagrama(idProceso: number): void {
    this.cargando = true;
    this.error = '';
    this.diagrama = undefined;
    this.diagramaService.obtenerDiagrama(idProceso).subscribe({
      next: (respuesta) => {
        this.diagrama = respuesta;
        this.formulario.reset({ descripcion: respuesta.proceso.descripcion ?? '' });
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: (error) => {
        this.error = mensajeDeError(error);
        this.aviso = '';
        this.cargando = false;
        this.cambios.markForCheck();
      }
    });
  }

  iniciarEdicion(): void {
    if (!this.diagrama) return;
    this.formulario.reset({ descripcion: this.diagrama.proceso.descripcion ?? '' });
    this.errorEdicion = '';
    this.aviso = '';
    this.editando = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.errorEdicion = '';
  }

  iniciarCreacionPool(): void {
    const orden = Math.max(0, ...(this.diagrama?.pools ?? []).map((pool) => pool.orden)) + 1;
    this.formularioPool.reset({
      nombre: '', tipoParticipante: 'EMPRESA', cajaNegra: false,
      posicionX: 0, posicionY: 0, ancho: 1000, alto: 400, orden
    });
    this.errorPool = '';
    this.aviso = '';
    this.creandoPool = true;
  }

  cancelarCreacionPool(): void {
    this.creandoPool = false;
    this.errorPool = '';
  }

  cargarRoles(): void {
    this.cargandoRoles = true;
    this.rolProcesoService.listar().subscribe({
      next: (respuesta) => {
        this.roles = respuesta.contenido.filter((rol) => rol.activo);
        this.cargandoRoles = false;
        this.cambios.markForCheck();
      },
      error: () => {
        this.roles = [];
        this.cargandoRoles = false;
        this.cambios.markForCheck();
      }
    });
  }

  iniciarCreacionLane(pool: Pool): void {
    const orden = Math.max(-1, ...this.lanesDePool(pool.id).map((lane) => lane.orden)) + 1;
    this.formularioLane.reset({
      rolProcesoId: this.roles[0]?.id ?? 0,
      orden,
      altura: 200
    });
    this.errorLane = '';
    this.aviso = '';
    this.creandoLaneParaPoolId = pool.id;
  }

  cancelarCreacionLane(): void {
    this.creandoLaneParaPoolId = null;
    this.errorLane = '';
  }

  crearLane(): void {
    if (!this.diagrama || this.creandoLaneParaPoolId === null || this.guardandoLane) return;
    if (this.formularioLane.invalid) {
      this.formularioLane.markAllAsTouched();
      return;
    }

    const datos: LaneCrearDatos = this.formularioLane.getRawValue();
    const procesoId = this.diagrama.proceso.id;
    const poolId = this.creandoLaneParaPoolId;
    this.guardandoLane = true;
    this.errorLane = '';
    this.diagramaService.crearLane(procesoId, poolId, datos).subscribe({
      next: () => {
        this.guardandoLane = false;
        this.creandoLaneParaPoolId = null;
        this.aviso = 'Lane creada correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorLane = mensajeDeError(error);
        this.guardandoLane = false;
        this.cambios.markForCheck();
      }
    });
  }

  iniciarCreacionNodo(pool: Pool): void {
    if (pool.cajaNegra) return;
    const lanes = this.lanesDePool(pool.id);
    const desplazamiento = this.nodosDePool(pool.id).length * 25;
    this.formularioNodo.reset({
      clase: 'ACTIVIDAD', nombre: '', posicionX: 50 + desplazamiento, posicionY: 80,
      ancho: 140, alto: 70, laneId: lanes[0]?.id ?? 0, tipoActividad: 'TAREA',
      tipoGateway: 'EXCLUSIVO', direccionGateway: 'DIVERGENCIA', tipoEvento: 'INICIO',
      naturalezaEvento: 'NORMAL', operacionMensaje: 'ENVIO'
    });
    this.errorNodo = '';
    this.aviso = '';
    this.creandoNodoParaPoolId = pool.id;
  }

  cancelarCreacionNodo(): void {
    this.creandoNodoParaPoolId = null;
    this.errorNodo = '';
  }

  crearNodo(): void {
    if (!this.diagrama || this.creandoNodoParaPoolId === null || this.guardandoNodo) return;
    if (this.formularioNodo.invalid) {
      this.formularioNodo.markAllAsTouched();
      return;
    }

    const valores = this.formularioNodo.getRawValue();
    const comunes = {
      poolId: this.creandoNodoParaPoolId,
      nombre: valores.nombre,
      posicionX: valores.posicionX,
      posicionY: valores.posicionY,
      ancho: valores.ancho,
      alto: valores.alto
    };
    let datos: NodoDatos;
    if (valores.clase === 'ACTIVIDAD') {
      if (valores.laneId < 1) {
        this.errorNodo = 'Una actividad debe pertenecer a una lane activa.';
        return;
      }
      datos = { ...comunes, clase: 'ACTIVIDAD', laneId: valores.laneId,
        tipoActividad: valores.tipoActividad as TipoActividad };
    } else if (valores.clase === 'GATEWAY') {
      datos = { ...comunes, clase: 'GATEWAY', tipoGateway: valores.tipoGateway as TipoGateway,
        direccionGateway: valores.direccionGateway as DireccionGateway };
    } else if (valores.naturalezaEvento === 'MENSAJE') {
      datos = { ...comunes, clase: 'EVENTO', tipoEvento: valores.tipoEvento as TipoEvento,
        naturalezaEvento: 'MENSAJE', operacionMensaje: valores.operacionMensaje as OperacionEventoMensaje };
    } else {
      datos = { ...comunes, clase: 'EVENTO', tipoEvento: valores.tipoEvento as TipoEvento,
        naturalezaEvento: 'NORMAL' };
    }

    const procesoId = this.diagrama.proceso.id;
    this.guardandoNodo = true;
    this.errorNodo = '';
    this.diagramaService.crearNodo(procesoId, datos).subscribe({
      next: () => {
        this.guardandoNodo = false;
        this.creandoNodoParaPoolId = null;
        this.aviso = 'Nodo creado correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorNodo = mensajeDeError(error);
        this.guardandoNodo = false;
        this.cambios.markForCheck();
      }
    });
  }

  crearPool(): void {
    if (!this.diagrama || this.guardandoPool) return;
    if (this.formularioPool.invalid) {
      this.formularioPool.markAllAsTouched();
      return;
    }

    const valores = this.formularioPool.getRawValue();
    const datos: PoolCrearDatos = {
      ...valores,
      tipoParticipante: valores.tipoParticipante as PoolCrearDatos['tipoParticipante']
    };
    const procesoId = this.diagrama.proceso.id;
    this.guardandoPool = true;
    this.errorPool = '';
    this.diagramaService.crearPool(procesoId, datos).subscribe({
      next: () => {
        this.guardandoPool = false;
        this.creandoPool = false;
        this.aviso = 'Pool creado correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorPool = mensajeDeError(error);
        this.guardandoPool = false;
        this.cambios.markForCheck();
      }
    });
  }

  guardarDescripcion(): void {
    if (!this.diagrama || this.guardando) return;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const proceso = this.diagrama.proceso;
    const { descripcion } = this.formulario.getRawValue();
    if (descripcion === (proceso.descripcion ?? '')) return;

    const datos: EditarProceso = {
      nombre: proceso.nombre,
      descripcion,
      categoria: proceso.categoria,
      estadoPublicacion: proceso.estadoPublicacion,
      version: proceso.version
    };
    this.guardando = true;
    this.errorEdicion = '';
    this.procesoService.actualizar(proceso.id, datos).subscribe({
      next: () => {
        this.guardando = false;
        this.editando = false;
        this.aviso = 'Descripción guardada.';
        this.cargarDiagrama(proceso.id);
      },
      error: (error) => {
        this.errorEdicion = mensajeDeError(error);
        this.guardando = false;
        this.cambios.markForCheck();
      }
    });
  }

  lanesDePool(poolId: number): Lane[] {
    return (this.diagrama?.lanes ?? [])
      .filter((lane) => lane.poolId === poolId)
      .sort((a, b) => a.orden - b.orden);
  }

  nodosDePool(poolId: number): Nodo[] {
    return (this.diagrama?.nodos ?? []).filter((nodo) => nodo.poolId === poolId);
  }

  arcosDePool(poolId: number): Arco[] {
    return (this.diagrama?.arcos ?? []).filter((arco) => arco.poolId === poolId);
  }

  altoLienzo(pool: Pool): number {
    const altoLanes = this.lanesDePool(pool.id)
      .reduce((total, lane) => total + (lane.altura ?? 0), 0);
    return Math.max(pool.alto ?? 0, altoLanes, 220);
  }

  anchoLienzo(pool: Pool): number {
    return Math.max(pool.ancho ?? 0, 620);
  }

  posicionLane(lane: Lane): number {
    return this.lanesDePool(lane.poolId)
      .filter((actual) => actual.orden < lane.orden)
      .reduce((total, actual) => total + (actual.altura ?? 0), 0);
  }

  nodoPorId(nodoId: number): Nodo | undefined {
    return this.diagrama?.nodos.find((nodo) => nodo.id === nodoId);
  }

  centroX(nodoId: number): number {
    const nodo = this.nodoPorId(nodoId);
    return nodo ? (nodo.posicionX ?? 0) + (nodo.ancho ?? 0) / 2 : 0;
  }

  centroY(nodoId: number): number {
    const nodo = this.nodoPorId(nodoId);
    return nodo ? (nodo.posicionY ?? 0) + (nodo.alto ?? 0) / 2 : 0;
  }

  puntoMedioX(arco: Arco): number {
    return (this.centroX(arco.origenId) + this.centroX(arco.destinoId)) / 2;
  }

  puntoMedioY(arco: Arco): number {
    return (this.centroY(arco.origenId) + this.centroY(arco.destinoId)) / 2;
  }

  nombrePool(poolId: number | null): string {
    if (poolId === null) return 'participante externo';
    return this.diagrama?.pools.find((pool) => pool.id === poolId)?.nombre ?? `Pool ${poolId}`;
  }

  nombreNodo(nodoId: number | null): string {
    if (nodoId === null) return 'participante externo';
    return this.nodoPorId(nodoId)?.nombre ?? `Nodo ${nodoId}`;
  }

  mensajeDeFlujo(flujo: FlujoMensaje): MensajeDetalle | undefined {
    return (this.diagrama?.mensajes ?? []).find(({ mensaje }) =>
      mensaje.nodoId === flujo.nodoOrigenId || mensaje.nodoId === flujo.nodoDestinoId
    );
  }

  etiquetaFlujo(flujo: FlujoMensaje): string {
    return this.mensajeDeFlujo(flujo)?.mensaje.nombre ?? 'Mensaje sin nombre';
  }

  correlacionFlujo(flujo: FlujoMensaje): string | null {
    const detalle = this.mensajeDeFlujo(flujo);
    if (!detalle) return null;
    return detalle.mensaje.correlacionNegocio ?? detalle.campos[0]?.nombre ?? null;
  }
}
