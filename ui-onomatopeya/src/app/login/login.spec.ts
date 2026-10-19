import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  it('muestra el error de credenciales del servidor', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(LoginComponent);
    vista.detectChanges();
    vista.componentInstance.correo = 'ana@ejemplo.com';
    vista.componentInstance.contrasena = 'clave-invalida';
    vista.componentInstance.entrar();

    const peticiones = TestBed.inject(HttpTestingController);
    peticiones.expectOne('/api/auth/login').flush(
      { detail: 'Credenciales inválidas.' },
      { status: 401, statusText: 'Unauthorized' }
    );
    await vista.whenStable();
    vista.detectChanges();

    expect((vista.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain('Credenciales inválidas.');
    peticiones.verify();
  });
});
