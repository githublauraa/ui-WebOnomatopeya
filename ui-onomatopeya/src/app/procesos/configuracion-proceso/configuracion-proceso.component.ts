import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mensajeDeError } from '../../models/error-response.model';
import { GuardarPermisoEstructura, PermisoEstructura } from '../../models/permiso-estructura.model';
import { Proceso } from '../../models/proceso.model';
import { PermisoEstructuraService } from '../../services/permiso-estructura.service';
import { ProcesoService } from '../../services/proceso.service';

@Component({
  selector: 'app-configuracion-proceso',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './configuracion-proceso.component.html'
})
export class ConfiguracionProcesoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly procesos = inject(ProcesoService);
  private readonly permisosService = inject(PermisoEstructuraService);
  private readonly cambios = inject(ChangeDetectorRef);

  procesoId = 0;
  proceso: Proceso | null = null;
  permisos: PermisoEstructura[] = [];
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  readonly comparticion = this.fb.nonNullable.group({
    empresaId: [0, [Validators.required, Validators.min(1)]],
    permitido: true
  });

  readonly permiso = this.fb.nonNullable.group({
    rolAcceso: this.fb.nonNullable.control<GuardarPermisoEstructura['rolAcceso']>('EDITOR'),
    recurso: this.fb.nonNullable.control<GuardarPermisoEstructura['recurso']>('POOL'),
    accion: this.fb.nonNullable.control<GuardarPermisoEstructura['accion']>('CREAR'),
    permitido: true
  });

  ngOnInit(): void {
    this.procesoId = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.procesoId) || this.procesoId < 1) {
      this.error = 'El proceso indicado no es válido.';
      return;
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({
      proceso: this.procesos.consultar(this.procesoId),
      permisos: this.permisosService.listar(this.procesoId)
    }).subscribe({
      next: ({ proceso, permisos }) => {
        this.proceso = proceso;
        this.permisos = permisos;
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: error => this.mostrarError(error)
    });
  }

  guardarComparticion(): void {
    if (!this.proceso || this.comparticion.invalid || this.guardando) {
      this.comparticion.markAllAsTouched();
      return;
    }
    this.iniciarGuardado();
    this.procesos.compartir(this.procesoId, {
      ...this.comparticion.getRawValue(),
      version: this.proceso.version
    }).subscribe({
      next: () => {
        this.mensaje = this.comparticion.controls.permitido.value
          ? 'Acceso de consulta habilitado.'
          : 'Acceso de consulta revocado.';
        this.guardando = false;
        this.cambios.markForCheck();
      },
      error: error => this.mostrarError(error)
    });
  }

  guardarPermiso(): void {
    if (this.permiso.invalid || this.guardando) return;
    const datos = this.permiso.getRawValue();
    const existente = this.permisos.find(item =>
      item.rolAcceso === datos.rolAcceso &&
      item.recurso === datos.recurso &&
      item.accion === datos.accion
    );
    this.iniciarGuardado();
    this.permisosService.guardar(this.procesoId, {
      ...datos,
      version: existente?.version
    }).subscribe({
      next: permiso => {
        this.permisos = [...this.permisos.filter(item => item.id !== permiso.id), permiso];
        this.mensaje = 'Permiso de estructura actualizado.';
        this.guardando = false;
        this.cambios.markForCheck();
      },
      error: error => this.mostrarError(error)
    });
  }

  private iniciarGuardado(): void {
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
  }

  private mostrarError(error: unknown): void {
    this.error = mensajeDeError(error);
    this.guardando = false;
    this.cargando = false;
    this.cambios.markForCheck();
  }
}
