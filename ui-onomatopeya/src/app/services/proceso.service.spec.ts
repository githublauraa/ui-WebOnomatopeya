import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProcesoService } from './proceso.service';

describe('ProcesoService', () => {
  let servicio: ProcesoService;
  let peticiones: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    servicio = TestBed.inject(ProcesoService);
    peticiones = TestBed.inject(HttpTestingController);
  });

  afterEach(() => peticiones.verify());

  it('consulta la primera página de procesos', () => {
    servicio.listar().subscribe(respuesta => expect(respuesta.total).toBe(1));

    const consulta = peticiones.expectOne('/api/procesos?pagina=0&tamanio=10');
    expect(consulta.request.method).toBe('GET');
    consulta.flush({ contenido: [{ id: 1, nombre: 'Compras' }], pagina: 0, tamanio: 10, total: 1, paginas: 1 });
  });

  it('envía la página solicitada', () => {
    servicio.listar(2).subscribe();

    const consulta = peticiones.expectOne('/api/procesos?pagina=2&tamanio=10');
    expect(consulta.request.method).toBe('GET');
    consulta.flush({ contenido: [], pagina: 2, tamanio: 10, total: 20, paginas: 2 });
  });
});
