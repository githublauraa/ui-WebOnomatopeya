import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UsuarioListComponent } from './usuario-list.component';

describe('UsuarioListComponent', () => {
  const ana = {
    id: 1,
    empresaId: 1,
    nombre: 'Ana',
    correo: 'ana@example.com',
    rolAcceso: 'ADMINISTRADOR',
    estado: 'ACTIVO',
    fechaCreacion: '2026-10-27T10:00:00Z',
    version: 0
  };

  it('muestra el correo, rol y estado recibidos del servidor', async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(UsuarioListComponent);
    const peticiones = TestBed.inject(HttpTestingController);
    vista.detectChanges();

    const consulta = peticiones.expectOne('/api/usuarios');
    expect(consulta.request.method).toBe('GET');
    consulta.flush([ana]);
    await vista.whenStable();
    vista.detectChanges();

    const contenido = (vista.nativeElement as HTMLElement).textContent;
    expect(contenido).toContain('ana@example.com');
    expect(contenido).toContain('ADMINISTRADOR');
    expect(contenido).toContain('ACTIVO');
    peticiones.verify();
  });

  it('envía la invitación y desactiva con la versión del usuario', async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(UsuarioListComponent);
    const peticiones = TestBed.inject(HttpTestingController);
    vista.detectChanges();
    peticiones.expectOne('/api/usuarios').flush([ana]);
    await vista.whenStable();
    vista.detectChanges();

    const pantalla = vista.nativeElement as HTMLElement;
    const nombre = pantalla.querySelector<HTMLInputElement>('#nombre')!;
    const correo = pantalla.querySelector<HTMLInputElement>('#correo')!;
    const rol = pantalla.querySelector<HTMLSelectElement>('#rolAcceso')!;
    nombre.value = 'Luis';
    nombre.dispatchEvent(new Event('input'));
    correo.value = 'luis@example.com';
    correo.dispatchEvent(new Event('input'));
    rol.value = 'EDITOR';
    rol.dispatchEvent(new Event('change'));
    pantalla.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const invitacion = peticiones.expectOne('/api/usuarios/invitaciones');
    expect(invitacion.request.method).toBe('POST');
    expect(invitacion.request.body).toEqual({
      nombre: 'Luis', correo: 'luis@example.com', rolAcceso: 'EDITOR'
    });
    const luis = { ...ana, id: 2, nombre: 'Luis', correo: 'luis@example.com', rolAcceso: 'EDITOR', estado: 'INVITADO' };
    invitacion.flush({ usuario: luis, tokenInvitacion: 'token-de-prueba', expiraEn: '2026-10-28T10:00:00Z' });
    await vista.whenStable();
    vista.detectChanges();
    expect(pantalla.textContent).toContain('token-de-prueba');

    const fila = [...pantalla.querySelectorAll('tbody tr')].find(tr => tr.textContent?.includes('luis@example.com'))!;
    (fila.querySelector('button') as HTMLButtonElement).click();
    vista.detectChanges();
    (fila.querySelector('button') as HTMLButtonElement).click();

    const desactivacion = peticiones.expectOne('/api/usuarios/2/desactivar');
    expect(desactivacion.request.method).toBe('POST');
    expect(desactivacion.request.body).toEqual({ version: 0, confirmar: true });
    desactivacion.flush({ ...luis, estado: 'INACTIVO', version: 1 });
    await vista.whenStable();
    vista.detectChanges();
    expect(fila.textContent).toContain('INACTIVO');
    peticiones.verify();
  });

  it('no envía una invitación sin nombre ni correo', async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(UsuarioListComponent);
    const peticiones = TestBed.inject(HttpTestingController);
    vista.detectChanges();
    peticiones.expectOne('/api/usuarios').flush([]);
    await vista.whenStable();
    vista.detectChanges();

    const pantalla = vista.nativeElement as HTMLElement;
    pantalla.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    vista.detectChanges();

    peticiones.expectNone('/api/usuarios/invitaciones');
    expect(pantalla.textContent).toContain('Escribe el nombre del usuario.');
    expect(pantalla.textContent).toContain('Escribe un correo válido.');
    peticiones.verify();
  });
});
