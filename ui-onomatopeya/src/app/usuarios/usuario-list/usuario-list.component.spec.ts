import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuarioListComponent } from './usuario-list.component';

describe('UsuarioListComponent', () => {
  it('muestra el correo, rol y estado recibidos del servidor', async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(UsuarioListComponent);
    const peticiones = TestBed.inject(HttpTestingController);
    vista.detectChanges();

    const consulta = peticiones.expectOne('/api/usuarios');
    expect(consulta.request.method).toBe('GET');
    consulta.flush([{
      id: 1,
      empresaId: 1,
      nombre: 'Ana',
      correo: 'ana@example.com',
      rolAcceso: 'ADMINISTRADOR',
      estado: 'ACTIVO',
      fechaCreacion: '2026-10-27T10:00:00Z',
      version: 0
    }]);
    await vista.whenStable();
    vista.detectChanges();

    const contenido = (vista.nativeElement as HTMLElement).textContent;
    expect(contenido).toContain('ana@example.com');
    expect(contenido).toContain('ADMINISTRADOR');
    expect(contenido).toContain('ACTIVO');
    peticiones.verify();
  });
});
