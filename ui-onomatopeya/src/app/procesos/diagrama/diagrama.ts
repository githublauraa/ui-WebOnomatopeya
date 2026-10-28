import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Arco, Diagrama, DireccionGateway, FlujoMensaje, Lane, LaneCrearDatos, LaneEditarDatos, MensajeDetalle,
  Nodo, NodoDatos, OperacionEventoMensaje, Pool, PoolCrearDatos, PoolEditarDatos,
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
  editandoPoolId: number | null = null;
  guardandoPool = false;
  creandoLaneParaPoolId: number | null = null;
  editandoLaneId: number | null = null;
  guardandoLane = false;
  creandoNodoParaPoolId: number | null = null;
  editandoNodoId: number | null = null;
  guardandoNodo = false;
  creandoArcoParaPoolId: number | null = null;
  guardandoArco = false;
  cargandoRoles = false;
  roles: RolProceso[] = [];
  errorNodo = '';
  errorArco = '';
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
  formularioArco = this.fb.nonNullable.group({
    origenId: [0, [Validators.required, Validators.min(1)]],
    destinoId: [0, [Validators.required, Validators.min(1)]],
    etiqueta: ['', Validators.maxLength(150)],
    condicionSalida: ['', Validators.maxLength(10000)]
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
    this.editandoPoolId = null;
    this.creandoPool = true;
  }

  cancelarCreacionPool(): void {
    this.creandoPool = false;
    this.editandoPoolId = null;
    this.errorPool = '';
  }

  iniciarEdicionPool(pool: Pool): void {
    this.formularioPool.reset({
      nombre: pool.nombre,
      tipoParticipante: pool.tipoParticipante,
      cajaNegra: pool.cajaNegra,
      posicionX: pool.posicionX ?? 0,
      posicionY: pool.posicionY ?? 0,
      ancho: pool.ancho ?? 1000,
      alto: pool.alto ?? 400,
      orden: pool.orden
    });
    this.creandoPool = false;
    this.editandoPoolId = pool.id;
    this.errorPool = '';
    this.aviso = '';
  }

  guardarPool(): void {
    if (this.editandoPoolId === null) this.crearPool();
    else this.actualizarPool(this.editandoPoolId);
  }

  actualizarPool(poolId: number): void {
    if (!this.diagrama || this.guardandoPool) return;
    if (this.formularioPool.invalid) {
      this.formularioPool.markAllAsTouched();
      return;
    }
    const pool = this.diagrama.pools.find((actual) => actual.id === poolId);
    if (!pool) return;
    const valores = this.formularioPool.getRawValue();
    const datos: PoolEditarDatos = {
      ...valores,
      tipoParticipante: valores.tipoParticipante as PoolEditarDatos['tipoParticipante'],
      version: pool.version
    };
    const procesoId = this.diagrama.proceso.id;
    this.guardandoPool = true;
    this.errorPool = '';
    this.diagramaService.editarPool(procesoId, poolId, datos).subscribe({
      next: () => {
        this.guardandoPool = false;
        this.editandoPoolId = null;
        this.aviso = 'Pool actualizado correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorPool = mensajeDeError(error);
        this.guardandoPool = false;
        this.cambios.markForCheck();
      }
    });
  }

  retirarPool(pool: Pool): void {
    if (!this.diagrama || this.guardandoPool) return;
    if (!window.confirm(`¿Retirar el pool "${pool.nombre}"? Esta acción no borra su historial.`)) return;
    const procesoId = this.diagrama.proceso.id;
    this.guardandoPool = true;
    this.errorPool = '';
    this.diagramaService.retirarPool(procesoId, pool.id, { version: pool.version, confirmar: true }).subscribe({
      next: () => {
        this.guardandoPool = false;
        this.aviso = 'Pool retirado correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorPool = mensajeDeError(error);
        this.guardandoPool = false;
        this.cambios.markForCheck();
      }
    });
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
    this.editandoLaneId = null;
    this.creandoLaneParaPoolId = pool.id;
  }

  cancelarCreacionLane(): void {
    this.creandoLaneParaPoolId = null;
    this.editandoLaneId = null;
    this.errorLane = '';
  }

  iniciarEdicionLane(lane: Lane): void {
    this.formularioLane.reset({
      rolProcesoId: lane.rolProcesoId ?? 0,
      orden: lane.orden,
      altura: lane.altura ?? 200
    });
    this.editandoLaneId = lane.id;
    this.creandoLaneParaPoolId = lane.poolId;
    this.errorLane = '';
    this.aviso = '';
  }

  guardarLane(): void {
    if (this.editandoLaneId === null) this.crearLane();
    else this.actualizarLane(this.editandoLaneId);
  }

  actualizarLane(laneId: number): void {
    if (!this.diagrama || this.guardandoLane) return;
    if (this.formularioLane.invalid) {
      this.formularioLane.markAllAsTouched();
      return;
    }
    const lane = this.diagrama.lanes.find((actual) => actual.id === laneId);
    if (!lane) return;
    const datos: LaneEditarDatos = { ...this.formularioLane.getRawValue(), version: lane.version };
    const procesoId = this.diagrama.proceso.id;
    this.guardandoLane = true;
    this.errorLane = '';
    this.diagramaService.editarLane(procesoId, lane.poolId, laneId, datos).subscribe({
      next: () => {
        this.guardandoLane = false;
        this.editandoLaneId = null;
        this.creandoLaneParaPoolId = null;
        this.aviso = 'Lane actualizada correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorLane = mensajeDeError(error);
        this.guardandoLane = false;
        this.cambios.markForCheck();
      }
    });
  }

  retirarLane(lane: Lane): void {
    if (!this.diagrama || this.guardandoLane) return;
    if (!window.confirm(`¿Retirar la lane "${lane.nombre}"? Primero resuelve las actividades que tenga asignadas.`)) return;
    const procesoId = this.diagrama.proceso.id;
    this.guardandoLane = true;
    this.errorLane = '';
    this.diagramaService.retirarLane(procesoId, lane.poolId, lane.id, { version: lane.version, confirmar: true }).subscribe({
      next: () => {
        this.guardandoLane = false;
        this.aviso = 'Lane retirada correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorLane = mensajeDeError(error);
        this.guardandoLane = false;
        this.cambios.markForCheck();
      }
    });
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
    this.editandoNodoId = null;
    this.creandoNodoParaPoolId = pool.id;
  }

  cancelarCreacionNodo(): void {
    this.creandoNodoParaPoolId = null;
    this.editandoNodoId = null;
    this.errorNodo = '';
  }

  iniciarEdicionNodo(nodo: Nodo): void {
    this.formularioNodo.reset({
      clase: nodo.clase,
      nombre: nodo.nombre,
      posicionX: nodo.posicionX ?? 0,
      posicionY: nodo.posicionY ?? 0,
      ancho: nodo.ancho ?? 140,
      alto: nodo.alto ?? 70,
      laneId: nodo.laneId ?? 0,
      tipoActividad: nodo.tipoActividad ?? 'TAREA',
      tipoGateway: nodo.tipoGateway ?? 'EXCLUSIVO',
      direccionGateway: nodo.direccionGateway ?? 'DIVERGENCIA',
      tipoEvento: nodo.tipoEvento ?? 'INICIO',
      naturalezaEvento: nodo.naturalezaEvento ?? 'NORMAL',
      operacionMensaje: nodo.operacionMensaje ?? 'ENVIO'
    });
    this.creandoNodoParaPoolId = nodo.poolId;
    this.editandoNodoId = nodo.id;
    this.errorNodo = '';
    this.aviso = '';
  }

  guardarNodo(): void {
    if (this.editandoNodoId === null) this.crearNodo();
    else this.actualizarNodo(this.editandoNodoId);
  }

  crearNodo(): void {
    if (!this.diagrama || this.creandoNodoParaPoolId === null || this.guardandoNodo) return;
    if (this.formularioNodo.invalid) {
      this.formularioNodo.markAllAsTouched();
      return;
    }

    const datos = this.datosNodo();
    if (!datos) return;

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

  actualizarNodo(nodoId: number): void {
    if (!this.diagrama || this.guardandoNodo) return;
    if (this.formularioNodo.invalid) {
      this.formularioNodo.markAllAsTouched();
      return;
    }
    const datos = this.datosNodo();
    if (!datos) return;
    const procesoId = this.diagrama.proceso.id;
    this.guardandoNodo = true;
    this.errorNodo = '';
    this.diagramaService.editarNodo(procesoId, nodoId, datos).subscribe({
      next: () => {
        this.guardandoNodo = false;
        this.editandoNodoId = null;
        this.creandoNodoParaPoolId = null;
        this.aviso = 'Nodo actualizado correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorNodo = mensajeDeError(error);
        this.guardandoNodo = false;
        this.cambios.markForCheck();
      }
    });
  }

  retirarNodo(nodo: Nodo): void {
    if (!this.diagrama || this.guardandoNodo) return;
    if (!window.confirm(`¿Retirar el nodo "${nodo.nombre}" y sus conexiones? Esta acción no borra su historial.`)) return;
    const procesoId = this.diagrama.proceso.id;
    this.guardandoNodo = true;
    this.errorNodo = '';
    this.diagramaService.retirarNodo(procesoId, nodo.id, {
      version: this.diagrama.proceso.version,
      confirmar: true
    }).subscribe({
      next: () => {
        this.guardandoNodo = false;
        this.aviso = 'Nodo retirado correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorNodo = mensajeDeError(error);
        this.guardandoNodo = false;
        this.cambios.markForCheck();
      }
    });
  }

  private datosNodo(): NodoDatos | null {
    if (this.creandoNodoParaPoolId === null) return null;
    const valores = this.formularioNodo.getRawValue();
    const comunes = {
      poolId: this.creandoNodoParaPoolId,
      nombre: valores.nombre,
      posicionX: valores.posicionX,
      posicionY: valores.posicionY,
      ancho: valores.ancho,
      alto: valores.alto
    };
    if (valores.clase === 'ACTIVIDAD') {
      if (valores.laneId < 1) {
        this.errorNodo = 'Una actividad debe pertenecer a una lane activa.';
        return null;
      }
      return { ...comunes, clase: 'ACTIVIDAD', laneId: valores.laneId,
        tipoActividad: valores.tipoActividad as TipoActividad };
    }
    if (valores.clase === 'GATEWAY') {
      return { ...comunes, clase: 'GATEWAY', tipoGateway: valores.tipoGateway as TipoGateway,
        direccionGateway: valores.direccionGateway as DireccionGateway };
    }
    if (valores.naturalezaEvento === 'MENSAJE') {
      return { ...comunes, clase: 'EVENTO', tipoEvento: valores.tipoEvento as TipoEvento,
        naturalezaEvento: 'MENSAJE', operacionMensaje: valores.operacionMensaje as OperacionEventoMensaje };
    }
    return { ...comunes, clase: 'EVENTO', tipoEvento: valores.tipoEvento as TipoEvento,
      naturalezaEvento: 'NORMAL' };
  }

  iniciarCreacionArco(pool: Pool): void {
    const nodos = this.nodosDePool(pool.id);
    this.formularioArco.reset({
      origenId: nodos[0]?.id ?? 0,
      destinoId: nodos[1]?.id ?? 0,
      etiqueta: '',
      condicionSalida: ''
    });
    this.errorArco = nodos.length < 2 ? 'Este pool necesita al menos dos nodos para crear un arco.' : '';
    this.aviso = '';
    this.creandoArcoParaPoolId = pool.id;
  }

  cancelarCreacionArco(): void {
    this.creandoArcoParaPoolId = null;
    this.errorArco = '';
  }

  crearArco(): void {
    if (!this.diagrama || this.creandoArcoParaPoolId === null || this.guardandoArco) return;
    if (this.formularioArco.invalid) {
      this.formularioArco.markAllAsTouched();
      return;
    }

    const valores = this.formularioArco.getRawValue();
    const origen = this.nodoPorId(valores.origenId);
    if (valores.origenId === valores.destinoId) {
      this.errorArco = 'El origen y el destino deben ser nodos distintos.';
      return;
    }
    const condicion = valores.condicionSalida.trim() || null;
    if (origen?.clase === 'GATEWAY' && origen.tipoGateway !== 'PARALELO' && !condicion) {
      this.errorArco = 'La salida de un gateway exclusivo o inclusivo requiere una condición.';
      return;
    }
    if (origen?.clase !== 'GATEWAY' && condicion) {
      this.errorArco = 'Solo las salidas de gateway pueden tener condición.';
      return;
    }
    if (origen?.clase === 'GATEWAY' && origen.tipoGateway === 'PARALELO' && condicion) {
      this.errorArco = 'Un gateway paralelo no usa condiciones.';
      return;
    }

    const procesoId = this.diagrama.proceso.id;
    this.guardandoArco = true;
    this.errorArco = '';
    this.diagramaService.crearArco(procesoId, {
      origenId: valores.origenId,
      destinoId: valores.destinoId,
      etiqueta: valores.etiqueta.trim() || null,
      condicionSalida: condicion
    }).subscribe({
      next: () => {
        this.guardandoArco = false;
        this.creandoArcoParaPoolId = null;
        this.aviso = 'Arco creado correctamente.';
        this.cargarDiagrama(procesoId);
      },
      error: (error) => {
        this.errorArco = mensajeDeError(error);
        this.guardandoArco = false;
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
