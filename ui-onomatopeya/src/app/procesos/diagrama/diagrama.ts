import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Diagrama } from '../../models/diagrama.model';
import { mensajeDeError } from '../../models/error-response.model';
import { DiagramaService } from '../../services/diagrama.service';
import { ProcesoService } from '../../services/proceso.service';

@Component({
  selector: 'app-diagrama',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './diagrama.html',
  styleUrl: './diagrama.css'
})
export class DiagramaComponent implements OnInit {

  diagrama?: Diagrama;
  cargando = true;
  error = '';
  editando = false;
  guardando = false;
  descripcionEditada = '';
  errorEdicion = '';
  aviso = '';

  constructor(
    private ruta: ActivatedRoute,
    private diagramaService: DiagramaService,
    private procesoService: ProcesoService,
    private cambios: ChangeDetectorRef
  ) {}

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
        this.descripcionEditada = respuesta.proceso.descripcion ?? '';
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
    this.descripcionEditada = this.diagrama.proceso.descripcion ?? '';
    this.errorEdicion = '';
    this.aviso = '';
    this.editando = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.errorEdicion = '';
  }

  guardarDescripcion(): void {
    if (!this.diagrama || this.guardando ||
        this.descripcionEditada === (this.diagrama.proceso.descripcion ?? '')) return;

    const proceso = this.diagrama.proceso;
    this.guardando = true;
    this.errorEdicion = '';
    this.procesoService.actualizar(proceso.id, {
      nombre: proceso.nombre,
      descripcion: this.descripcionEditada,
      categoria: proceso.categoria,
      estadoPublicacion: proceso.estadoPublicacion,
      version: proceso.version
    }).subscribe({
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
}
