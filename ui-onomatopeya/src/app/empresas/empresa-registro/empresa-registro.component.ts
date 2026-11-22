import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Empresa, RegistroEmpresa } from '../../models/empresa.model';
import { mensajeDeError } from '../../models/error-response.model';
import { EmpresaService } from '../../services/empresa.service';

function contrasenasCoinciden(control: AbstractControl): ValidationErrors | null {
  const clave = control.get('contrasena')?.value;
  const confirmacion = control.get('confirmarContrasena')?.value;
  return clave && confirmacion && clave !== confirmacion ? { contrasenasDistintas: true } : null;
}

@Component({
  selector: 'app-empresa-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './empresa-registro.component.html'
})
export class RegistroEmpresaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly empresas = inject(EmpresaService);
  private readonly cambios = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    nombreEmpresa: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    nit: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)]],
    correoContacto: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    nombreAdministrador: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    correoAdministrador: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    contrasena: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmarContrasena: ['', Validators.required]
  }, { validators: contrasenasCoinciden });

  guardando = false;
  error = '';
  empresaCreada: Empresa | null = null;

  get clavesDistintas(): boolean {
    return this.formulario.hasError('contrasenasDistintas')
      && this.formulario.controls.confirmarContrasena.touched;
  }

  registrar(): void {
    if (this.guardando || this.empresaCreada) return;

    // Limpiar los textos antes de validar el formulario.
    // No modificar la contraseña.
    for (const nombre of [
      'nombreEmpresa', 'nit', 'correoContacto',
      'nombreAdministrador', 'correoAdministrador'
    ] as const) {
      const control = this.formulario.controls[nombre];
      control.setValue(control.value.trim(), { emitEvent: false });
    }
    this.error = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos: RegistroEmpresa = {
      empresa: {
        nombre: valores.nombreEmpresa.trim(),
        nit: valores.nit.trim(),
        correoContacto: valores.correoContacto.trim()
      },
      administrador: {
        nombre: valores.nombreAdministrador.trim(),
        correo: valores.correoAdministrador.trim(),
        contrasena: valores.contrasena
      }
    };

    this.guardando = true;
    this.empresas.registrar(datos).subscribe({
      next: empresa => {
        this.empresaCreada = empresa;
        this.formulario.controls.contrasena.reset();
        this.formulario.controls.confirmarContrasena.reset();
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
