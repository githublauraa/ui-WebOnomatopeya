import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { mensajeDeError } from '../models/error-response.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="container mt-5" style="max-width: 420px">
      <h1 class="h3 mb-4">Iniciar sesión</h1>
      <form #formulario="ngForm" (ngSubmit)="entrar()">
        <div class="mb-3">
          <label for="correo" class="form-label">Correo</label>
          <input id="correo" name="correo" type="email" class="form-control"
                 [(ngModel)]="correo" required email autocomplete="username">
        </div>
        <div class="mb-3">
          <label for="contrasena" class="form-label">Contraseña</label>
          <input id="contrasena" name="contrasena" type="password" class="form-control"
                 [(ngModel)]="contrasena" required autocomplete="current-password">
        </div>
        @if (error) {
          <p class="alert alert-danger" role="alert">{{ error }}</p>
        }
        <button type="submit" class="btn btn-primary" [disabled]="formulario.invalid || cargando">
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </main>
  `
})
export class LoginComponent {
  correo = '';
  contrasena = '';
  cargando = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  entrar(): void {
    if (!this.correo.trim() || !this.contrasena || this.cargando) return;

    this.error = '';
    this.cargando = true;
    this.auth.iniciar({ correo: this.correo.trim(), contrasena: this.contrasena }).subscribe({
      next: () => {
        this.cargando = false;
        void this.router.navigateByUrl('/usuarios');
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.cargando = false;
      }
    });
  }
}
