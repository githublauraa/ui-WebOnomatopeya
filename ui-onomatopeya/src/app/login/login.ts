import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { mensajeDeError } from '../models/error-response.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cambios = inject(ChangeDetectorRef);

  readonly formulario = this.formBuilder.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required]
  });
  cargando = false;
  error = '';

  entrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.cargando) return;

    const datos = this.formulario.getRawValue();
    this.error = '';
    this.cargando = true;
    this.auth.iniciar({ correo: datos.correo.trim(), contrasena: datos.contrasena }).subscribe({
      next: () => {
        this.cargando = false;
        this.cambios.markForCheck();
        void this.router.navigateByUrl('/procesos');
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.cargando = false;
        this.cambios.markForCheck();
      }
    });
  }
}
