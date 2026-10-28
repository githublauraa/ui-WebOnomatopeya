import { AuthService } from '../../services/auth.service';
import { Proceso } from '../../models/proceso.model';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProcesosListComponent } from './procesos-list.component';

describe('ProcesosListComponent', () => {
  let peticiones: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesosListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    peticiones = TestBed.inject(HttpTestingController);
  });

  afterEach(() => peticiones.verify());

  it('muestra los procesos recibidos del servidor', async () => {
    const vista = TestBed.createComponent(ProcesosListComponent);
    vista.detectChanges();

    peticiones.expectOne('/api/procesos?pagina=0&tamanio=10&activo=true').flush({
      contenido: [{ id: 7, nombre: 'Compras', categoria: 'Administrativo', estadoPublicacion: 'BORRADOR' }],
      pagina: 0, tamanio: 10, total: 1, paginas: 1
    });
    await vista.whenStable();
    vista.detectChanges();

    const enlace = (vista.nativeElement as HTMLElement).querySelector('.list-group-item a');
    expect(enlace?.textContent).toContain('Compras');
    expect(enlace?.getAttribute('href')).toBe('/procesos/7/diagrama');
  });

  it('muestra un error claro cuando no hay conexión', async () => {
    const vista = TestBed.createComponent(ProcesosListComponent);
    vista.detectChanges();

    peticiones.expectOne('/api/procesos?pagina=0&tamanio=10&activo=true').error(new ProgressEvent('error'));
    await vista.whenStable();
    vista.detectChanges();

    expect((vista.nativeElement as HTMLElement).textContent).toContain('No se pudo conectar con el servidor.');
  });

  it('retira únicamente después de confirmar y conserva el filtro al recargar', async () => {
    TestBed.inject(AuthService).usuario.set({ id: 1, empresaId: 1, nombre: 'Ana',
      correo: 'ana@example.com', rolAcceso: 'ADMINISTRADOR', estado: 'ACTIVO', fechaCreacion: '', version: 0 });
    const proceso: Proceso = { id: 7, empresaId: 1, creadorId: 1, nombre: 'Compras',
      descripcion: null, categoria: 'Compras', estadoPublicacion: 'BORRADOR', activo: true,
      fechaCreacion: '', version: 4 };
    const vista = TestBed.createComponent(ProcesosListComponent);
    vista.detectChanges();
    peticiones.expectOne(p => p.url === '/api/procesos').flush({
      contenido: [proceso], pagina: 0, tamanio: 10, total: 1, paginas: 1
    });
    await vista.whenStable();
    vista.detectChanges();
    const pantalla = vista.nativeElement as HTMLElement;
    Array.from(pantalla.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Retirar')!.click();
    peticiones.expectNone(p => p.method === 'DELETE');
    vista.detectChanges();
    Array.from(pantalla.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Confirmar retirada')!.click();
    const retirada = peticiones.expectOne('/api/procesos/7');
    expect(retirada.request.body).toEqual({ version: 4, confirmar: true });
    retirada.flush(null, { status: 204, statusText: 'No Content' });
    peticiones.expectOne('/api/procesos?pagina=0&tamanio=10&activo=true').flush({
      contenido: [], pagina: 0, tamanio: 10, total: 0, paginas: 0
    });
    await vista.whenStable();
    vista.detectChanges();
    expect(pantalla.textContent).toContain('quedó inactivo');
  });

  it('permite historial a lectura y oculta crear, editar y retirar', async () => {
    TestBed.inject(AuthService).usuario.set({ id: 2, empresaId: 1, nombre: 'Luis',
      correo: 'luis@example.com', rolAcceso: 'LECTURA', estado: 'ACTIVO', fechaCreacion: '', version: 0 });
    const vista = TestBed.createComponent(ProcesosListComponent);
    vista.detectChanges();
    peticiones.expectOne(p => p.url === '/api/procesos').flush({
      contenido: [{ id: 7, empresaId: 1, activo: true, nombre: 'Compras' }],
      pagina: 0, tamanio: 10, total: 1, paginas: 1
    });
    await vista.whenStable();
    vista.detectChanges();
    const pantalla = vista.nativeElement as HTMLElement;
    expect(pantalla.textContent).not.toContain('Crear proceso');
    expect(pantalla.textContent).not.toContain('Editar');
    expect(pantalla.textContent).not.toContain('Retirar');
    Array.from(pantalla.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Historial')!.click();
    peticiones.expectOne('/api/procesos/7/historial').flush([
      { id: 1, fecha: '2026-10-28T12:00:00Z', accion: 'CREAR', descripcion: 'Proceso creado', tipoObjeto: 'PROCESO', objetoId: 7, actorId: 1 }
    ]);
    await vista.whenStable();
    vista.detectChanges();
    expect(pantalla.textContent).toContain('Proceso creado');
  });
});
