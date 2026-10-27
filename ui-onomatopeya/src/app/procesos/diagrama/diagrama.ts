import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Diagrama } from '../../models/diagrama.model';
import { mensajeDeError } from '../../models/error-response.model';
import { DatosProceso } from '../../models/proceso.model';
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

    const datos: DatosProceso = {
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
}
