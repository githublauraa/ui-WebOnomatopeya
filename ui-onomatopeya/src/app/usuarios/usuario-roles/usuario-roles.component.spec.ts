import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsuarioRolesComponent } from './usuario-roles.component';

describe('UsuarioRolesComponent', () => {
  let peticiones: HttpTestingController;
  const administrador = {
    id: 1, empresaId: 1, nombre: 'Ana', correo: 'ana@example.com',
    rolAcceso: 'ADMINISTRADOR' as const, estado: 'ACTIVO' as const,
    fechaCreacion: '2026-11-20T10:00:00Z', version: 2
  };
  const editor = {
    ...administrador, id: 2, nombre: 'Luis', correo: 'luis@example.com',
    rolAcceso: 'EDITOR' as const, version: 4
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioRolesComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    peticiones = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).usuario.set(administrador);
  });

  afterEach(() => peticiones.verify());

  it('presenta los usuarios y describe la tabla de roles', async () => {
    const vista = TestBed.createComponent(UsuarioRolesComponent);
    vista.detectChanges();
    peticiones.expectOne('/api/usuarios').flush([administrador, editor]);
    await vista.whenStable();
    vista.detectChanges();

    const pantalla = vista.nativeElement as HTMLElement;
    expect(pantalla.querySelector('caption')?.textContent).toContain('Roles asignados');
    expect(pantalla.textContent).toContain('luis@example.com');
    expect(pantalla.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('cambia un rol después de la confirmación y actualiza la sesión propia', async () => {
    const vista = TestBed.createComponent(UsuarioRolesComponent);
    vista.detectChanges();
    peticiones.expectOne('/api/usuarios').flush([administrador, editor]);
    await vista.whenStable();
    vista.detectChanges();
    const componente = vista.componentInstance;

    componente.seleccionar(editor, { target: { value: 'LECTURA' } } as unknown as Event);
    expect(componente.cambiosPendientes[2]).toBe('LECTURA');
    componente.confirmandoId = 2;
    componente.guardar(editor);
    const cambio = peticiones.expectOne('/api/usuarios/2/rol');
    expect(cambio.request.method).toBe('PATCH');
    expect(cambio.request.body).toEqual({ rolAcceso: 'LECTURA', version: 4 });
    cambio.flush({ ...editor, rolAcceso: 'LECTURA', version: 5 });

    expect(componente.usuarios[1].rolAcceso).toBe('LECTURA');
    expect(componente.mensaje).toContain('Luis');
    expect(componente.cambiosPendientes[2]).toBeUndefined();

    componente.seleccionar(administrador, { target: { value: 'EDITOR' } } as unknown as Event);
    componente.confirmandoId = 1;
    componente.guardar(administrador);
    peticiones.expectOne('/api/usuarios/1/rol').flush({ ...administrador, rolAcceso: 'EDITOR', version: 3 });
    expect(TestBed.inject(AuthService).usuario()?.rolAcceso).toBe('EDITOR');
  });

  it('ignora valores de rol desconocidos y usuarios inactivos', () => {
    const vista = TestBed.createComponent(UsuarioRolesComponent);
    const componente = vista.componentInstance;
    componente.usuarios = [editor];

    componente.seleccionar(editor, { target: { value: 'SUPERUSUARIO' } } as unknown as Event);
    componente.confirmandoId = editor.id;
    componente.guardar({ ...editor, estado: 'INACTIVO' });

    expect(componente.cambiosPendientes[editor.id]).toBeUndefined();
    peticiones.expectNone('/api/usuarios/2/rol');
  });

  it('muestra el error recibido al consultar usuarios', async () => {
    const vista = TestBed.createComponent(UsuarioRolesComponent);
    vista.detectChanges();
    peticiones.expectOne('/api/usuarios').flush(
      { detail: 'No fue posible consultar los usuarios.' },
      { status: 500, statusText: 'Server Error' }
    );
    await vista.whenStable();
    vista.detectChanges();

    expect(vista.componentInstance.error).toBe('No fue posible consultar los usuarios.');
    expect((vista.nativeElement as HTMLElement).textContent).toContain('No fue posible consultar');
  });
});
