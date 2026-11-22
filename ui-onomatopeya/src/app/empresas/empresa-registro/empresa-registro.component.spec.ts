import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegistroEmpresaComponent } from './empresa-registro.component';

describe('HU-01 · Registro de empresa', () => {
  let peticiones: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroEmpresaComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    peticiones = TestBed.inject(HttpTestingController);
  });

  afterEach(() => peticiones.verify());

  function llenar(vista: ComponentFixture<RegistroEmpresaComponent>): void {
    vista.componentInstance.formulario.setValue({
      nombreEmpresa: ' Empresa Uno ',
      nit: ' 900123456-7 ',
      correoContacto: ' contacto@example.com ',
      nombreAdministrador: ' Administrador Uno ',
      correoAdministrador: ' admin@example.com ',
      contrasena: 'ClaveSegura123!',
      confirmarContrasena: 'ClaveSegura123!'
    });
  }

  it('rechaza campos obligatorios vacíos sin llamar al backend', () => {
    const vista = TestBed.createComponent(RegistroEmpresaComponent);
    vista.detectChanges();
    vista.componentInstance.registrar();
    vista.detectChanges();
    expect(vista.componentInstance.formulario.invalid).toBe(true);
    expect((vista.nativeElement as HTMLElement).textContent).toContain('Escribe el nombre de la empresa');
    peticiones.expectNone('/api/empresas');
  });

  it('rechaza contraseñas diferentes sin realizar el registro', () => {
    const vista = TestBed.createComponent(RegistroEmpresaComponent);
    vista.detectChanges();
    llenar(vista);
    vista.componentInstance.formulario.controls.confirmarContrasena.setValue('OtraClave123!');
    vista.componentInstance.registrar();
    vista.detectChanges();
    expect(vista.componentInstance.formulario.hasError('contrasenasDistintas')).toBe(true);
    expect((vista.nativeElement as HTMLElement).textContent).toContain('Las contraseñas no coinciden.');
    peticiones.expectNone('/api/empresas');
  });

  it('envía el contrato correcto y muestra confirmación sin exponer la contraseña', async () => {
    const vista = TestBed.createComponent(RegistroEmpresaComponent);
    vista.detectChanges();
    llenar(vista);
    vista.componentInstance.registrar();
    const peticion = peticiones.expectOne('/api/empresas');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      empresa: {
        nombre: 'Empresa Uno', nit: '900123456-7', correoContacto: 'contacto@example.com'
      },
      administrador: {
        nombre: 'Administrador Uno', correo: 'admin@example.com', contrasena: 'ClaveSegura123!'
      }
    });
    peticion.flush({ id: 12, nombre: 'Empresa Uno', nit: '900123456-7', correoContacto: 'contacto@example.com' },
      { status: 201, statusText: 'Created' });
    await vista.whenStable();
    vista.detectChanges();
    const texto = (vista.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Registro completado');
    expect(texto).toContain('Empresa Uno');
    expect(texto).not.toContain('ClaveSegura123!');
    expect(vista.componentInstance.formulario.controls.contrasena.value).toBe('');
    expect((vista.nativeElement as HTMLElement).querySelector('a[href="/login"]')).not.toBeNull();
  });

  it('evita enviar dos registros mientras el primero está pendiente', () => {
    const vista = TestBed.createComponent(RegistroEmpresaComponent);
    vista.detectChanges();
    llenar(vista);
    vista.componentInstance.registrar();
    vista.componentInstance.registrar();
    const pendientes = peticiones.match('/api/empresas');
    expect(pendientes.length).toBe(1);
    pendientes[0].flush({ id: 1, nombre: 'Empresa Uno', nit: '900123456-7', correoContacto: 'contacto@example.com' },
      { status: 201, statusText: 'Created' });
  });

  it('muestra HTTP 409 por NIT o correo duplicado sin marcar éxito', async () => {
    const vista = TestBed.createComponent(RegistroEmpresaComponent);
    vista.detectChanges();
    llenar(vista);
    vista.componentInstance.registrar();
    peticiones.expectOne('/api/empresas').flush(
      { detail: 'El NIT o el correo del administrador ya está registrado.' },
      { status: 409, statusText: 'Conflict' }
    );
    await vista.whenStable();
    vista.detectChanges();
    expect((vista.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain('ya está registrado');
    expect(vista.componentInstance.empresaCreada).toBeNull();
    expect(vista.componentInstance.guardando).toBe(false);
  });
});
