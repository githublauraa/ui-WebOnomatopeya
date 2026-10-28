import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../models/error-response.model';
import { RolProceso } from '../models/rol-proceso.model';
import { AuthService } from '../services/auth.service';
import { RolProcesoService } from '../services/rol-proceso.service';

@Component({
  selector: 'app-roles-proceso',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './roles-proceso.component.html'
})
export class RolesProcesoComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly servicio = inject(RolProcesoService);
  private readonly fb = inject(FormBuilder);
  private readonly cambios = inject(ChangeDetectorRef);

  roles: RolProceso[] = [];
  pagina = 0;
  paginas = 0;
  total = 0;
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';
  editando: RolProceso | null = null;
  retirando: RolProceso | null = null;
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(10000)]]
  });

  ngOnInit(): void { this.cargar(); }

  cargar(pagina = this.pagina): void {
    this.cargando = true;
    this.error = '';
    this.servicio.listar('', pagina, 20).subscribe({
      next: pagina => {
        this.roles = pagina.contenido.filter(rol => rol.activo);
        this.pagina = pagina.pagina;
        this.paginas = pagina.paginas;
        this.total = pagina.total;
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

  editar(rol: RolProceso): void {
    if (!this.auth.esAdministrador() || this.guardando) return;
    this.editando = rol;
    this.retirando = null;
    this.error = '';
    this.formulario.reset({nombre:rol.nombre, descripcion:rol.descripcion ?? ''});
  }

  nuevo(): void {
    this.editando = null;
    this.retirando = null;
    this.error = '';
    this.formulario.reset({nombre:'',descripcion:''});
  }

  guardar(): void {
    if (!this.auth.esAdministrador() || this.guardando) return;
    this.error = '';
    this.mensaje = '';
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    const valores = this.formulario.getRawValue();
    const nombre = valores.nombre.trim();
    if (!nombre) {this.error = 'El nombre no puede estar vacío.'; return;}
    const datos = { nombre, descripcion: valores.descripcion.trim(), version: this.editando?.version ?? null };
    this.guardando = true;
    const operacion = this.editando
      ? this.servicio.actualizar(this.editando.id, { ...datos, version: this.editando.version })
      : this.servicio.crear(datos);
    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = this.editando ? 'Rol de proceso actualizado.' : 'Rol de proceso creado.';
        this.nuevo();
        this.cargar();
      },
      error: error => { this.error = mensajeDeError(error); this.guardando = false; this.cambios.markForCheck(); }
    });
  }

  confirmarRetiro(rol: RolProceso): void {
    if (!this.auth.esAdministrador() || this.guardando) return;
    this.retirando = rol;
    this.error = '';
  }

  retirar(): void {
    if (!this.auth.esAdministrador() || !this.retirando || this.guardando) return;
    const rol = this.retirando;
    this.guardando = true;
    this.error = '';
    this.servicio.retirar(rol.id, { version: rol.version, confirmar: true }).subscribe({
      next: () => {
        this.guardando = false;
        this.retirando = null;
        this.mensaje = 'Rol retirado sin eliminar su historial.';
        this.cargar();
      },
      error: error => { this.guardando = false; this.error = mensajeDeError(error); this.cambios.markForCheck(); }
    });
  }
}
