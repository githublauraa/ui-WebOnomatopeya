import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  it('señala los campos inválidos antes de enviar', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(LoginComponent);
    vista.detectChanges();
    vista.componentInstance.entrar();
    vista.detectChanges();

    const contenido = (vista.nativeElement as HTMLElement).textContent ?? '';
    expect(contenido).toContain('Ingresa el correo.');
    expect(contenido).toContain('Ingresa la contraseña.');
    TestBed.inject(HttpTestingController).expectNone('/api/auth/login');
  });

  it('muestra el error de credenciales del servidor', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(LoginComponent);
    vista.detectChanges();
    vista.componentInstance.formulario.setValue({
      correo: 'ana@ejemplo.com',
      contrasena: 'clave-invalida'
    });
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
