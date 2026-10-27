import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../models/error-response.model';
import { CrearProceso, EditarProceso, Proceso } from '../../models/proceso.model';
import { ProcesoService } from '../../services/proceso.service';

@Component({
  selector: 'app-proceso-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './proceso-form.component.html'
})
export class ProcesoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly procesos = inject(ProcesoService);
  private readonly cambios = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(10000)],
    categoria: ['', Validators.maxLength(100)],
    estadoPublicacion: this.fb.nonNullable.control<'BORRADOR' | 'PUBLICADO'>('BORRADOR')
  });

  proceso: Proceso | null = null;
  guardado: Proceso | null = null;
  cargando = false;
  guardando = false;
  error = '';

  get editando(): boolean {
    return this.ruta.snapshot.paramMap.has('id');
  }

  ngOnInit(): void {
    if (!this.editando) return;

    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del proceso no es válido.';
      return;
    }

    this.cargando = true;
    this.procesos.consultar(id).subscribe({
      next: proceso => {
        this.proceso = proceso;
        this.formulario.reset({
          nombre: proceso.nombre,
          descripcion: proceso.descripcion ?? '',
          categoria: proceso.categoria ?? '',
          estadoPublicacion: proceso.estadoPublicacion
        });
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.cargando = false;
        this.cambios.markForCheck();
      }
    });
  }

  guardar(): void {
    if (this.guardando || this.cargando || (this.guardado && !this.editando)) return;

    this.error = '';
    this.guardado = null;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos: CrearProceso = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      categoria: valores.categoria.trim() || null,
      estadoPublicacion: 'BORRADOR'
    };

    if (this.editando && !this.proceso) return;

    const edicion: EditarProceso | null = this.proceso ? {
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      categoria: datos.categoria ?? null,
      estadoPublicacion: valores.estadoPublicacion,
      version: this.proceso.version
    } : null;
    const solicitud = this.proceso && edicion
      ? this.procesos.actualizar(this.proceso.id, edicion)
      : this.procesos.crear(datos);

    this.guardando = true;
    solicitud.subscribe({
      next: proceso => {
        this.proceso = proceso;
        this.guardado = proceso;
        this.guardando = false;
        this.cambios.markForCheck();
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.guardando = false;
        this.cambios.markForCheck();
      }
    });
  }
}
