import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Arco, Diagrama, Lane, Nodo, Pool } from '../../models/diagrama.model';
import { mensajeDeError } from '../../models/error-response.model';
import { EditarProceso } from '../../models/proceso.model';
import { DiagramaService } from '../../services/diagrama.service';
import { ProcesoService } from '../../services/proceso.service';

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
  private cambios = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  diagrama?: Diagrama;
  cargando = true;
  error = '';
  editando = false;
  guardando = false;
  errorEdicion = '';
  aviso = '';
  formulario = this.fb.nonNullable.group({
    descripcion: ['', Validators.maxLength(10000)]
  });

  ngOnInit(): void {
    const idProceso = Number(this.ruta.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idProceso) || idProceso <= 0) {
      this.error = 'No se recibió un identificador de proceso válido.';
      this.cargando = false;
      return;
    }

    this.cargarDiagrama(idProceso);
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
}
