import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensajeDeError } from '../../models/error-response.model';
import {
  DatosDesactivacion,
  DatosInvitacion,
  InvitacionUsuario,
  RolAcceso,
  Usuario
} from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-list.component.html'
})
export class UsuarioListComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly cambios = inject(ChangeDetectorRef);

  formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    rolAcceso: this.fb.nonNullable.control<RolAcceso>('LECTURA', Validators.required)
  });

  usuarios: Usuario[] = [];
  cargando = false;
  cargaFallida = false;
  guardando = false;
  confirmandoId: number | null = null;
  desactivandoId: number | null = null;
  error = '';
  mensaje = '';
  invitacion: InvitacionUsuario | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.cargaFallida = false;
    this.error = '';
    this.usuarioService.obtenerUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.cargando = false;
        this.cargaFallida = true;
        this.cambios.markForCheck();
      }
    });
  }

  invitar(): void {
    if (!this.auth.esAdministrador()) return;
    if (this.guardando) return;
    this.error = '';
    this.mensaje = '';
    this.invitacion = null;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos: DatosInvitacion = {
      nombre: valores.nombre.trim(),
      correo: valores.correo.trim(),
      rolAcceso: valores.rolAcceso
    };
    this.guardando = true;
    this.usuarioService.invitar(datos).subscribe({
      next: respuesta => {
        this.usuarios = [...this.usuarios, respuesta.usuario];
        this.invitacion = respuesta;
        this.mensaje = 'Invitación creada.';
        this.formulario.reset({ nombre: '', correo: '', rolAcceso: 'LECTURA' });
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

  desactivar(usuario: Usuario): void {
    if (!this.auth.esAdministrador()) return;
    if (this.confirmandoId !== usuario.id || this.desactivandoId !== null) return;

    const datos: DatosDesactivacion = { version: usuario.version, confirmar: true };
    this.confirmandoId = null;
    this.desactivandoId = usuario.id;
    this.error = '';
    this.mensaje = '';
    this.usuarioService.desactivar(usuario.id, datos).subscribe({
      next: actualizado => {
        this.usuarios = this.usuarios.map(actual =>
          actual.id === actualizado.id ? actualizado : actual
        );
        this.mensaje = `${actualizado.nombre} quedó inactivo.`;
        this.desactivandoId = null;
        this.cambios.markForCheck();
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.desactivandoId = null;
        this.cambios.markForCheck();
      }
    });
  }
}
