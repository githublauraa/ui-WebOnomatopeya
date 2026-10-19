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

    peticiones.expectOne('/api/procesos?pagina=0&tamanio=10').flush({
      contenido: [{ id: 7, nombre: 'Compras', categoria: 'Administrativo', estadoPublicacion: 'BORRADOR' }],
      pagina: 0, tamanio: 10, total: 1, paginas: 1
    });
    await vista.whenStable();
    vista.detectChanges();

    const enlace = (vista.nativeElement as HTMLElement).querySelector('a.list-group-item');
    expect(enlace?.textContent).toContain('Compras');
    expect(enlace?.getAttribute('href')).toBe('/procesos/7/diagrama');
  });

  it('muestra un error claro cuando no hay conexión', async () => {
    const vista = TestBed.createComponent(ProcesosListComponent);
    vista.detectChanges();

    peticiones.expectOne('/api/procesos?pagina=0&tamanio=10').error(new ProgressEvent('error'));
    await vista.whenStable();
    vista.detectChanges();

    expect((vista.nativeElement as HTMLElement).textContent).toContain('No se pudo conectar con el servidor.');
  });
});
