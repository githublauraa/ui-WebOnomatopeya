import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../models/error-response.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-aceptar-invitacion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './aceptar-invitacion.component.html'
})
export class AceptarInvitacionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuarios = inject(UsuarioService);
  private readonly cambios = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    token: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{43}$/)]],
    contrasena: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmar: ['', Validators.required]
  });
  guardando = false;
  completado = false;
  error = '';

  aceptar(): void {
    if (this.guardando || this.completado) return;
    this.error = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { token, contrasena, confirmar } = this.formulario.getRawValue();
    if (contrasena !== confirmar) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }
    this.guardando = true;
    this.usuarios.aceptarInvitacion({ token: token.trim(), contrasena }).subscribe({
      next: () => {
        this.completado = true;
        this.formulario.reset();
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
