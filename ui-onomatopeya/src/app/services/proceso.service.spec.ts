import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CrearProceso, EditarProceso, Proceso } from '../models/proceso.model';
import { ProcesoService } from './proceso.service';

describe('ProcesoService', () => {
  const proceso: Proceso = {
    id: 7,
    empresaId: 1,
    creadorId: 2,
    nombre: 'Compras',
    descripcion: null,
    categoria: 'Administración',
    estadoPublicacion: 'BORRADOR',
    activo: true,
    fechaCreacion: '2026-10-27T10:00:00Z',
    version: 0
  };

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
    consulta.flush({ contenido: [proceso], pagina: 0, tamanio: 10, total: 1, paginas: 1 });
  });

  it('envía la página solicitada', () => {
    servicio.listar(2).subscribe();

    const consulta = peticiones.expectOne('/api/procesos?pagina=2&tamanio=10');
    expect(consulta.request.method).toBe('GET');
    consulta.flush({ contenido: [], pagina: 2, tamanio: 10, total: 20, paginas: 2 });
  });

  it('consulta un proceso por su identificador', () => {
    servicio.consultar(7).subscribe(proceso => expect(proceso.nombre).toBe('Compras'));

    const consulta = peticiones.expectOne('/api/procesos/7');
    expect(consulta.request.method).toBe('GET');
    consulta.flush(proceso);
  });

  it('crea un proceso en borrador sin enviar campos de respuesta', () => {
    const datos: CrearProceso = {
      nombre: 'Compras',
      descripcion: null,
      categoria: 'Administración',
      estadoPublicacion: 'BORRADOR'
    };
    servicio.crear(datos).subscribe(proceso => expect(proceso.id).toBe(7));

    const consulta = peticiones.expectOne('/api/procesos');
    expect(consulta.request.method).toBe('POST');
    expect(consulta.request.body).toEqual(datos);
    consulta.flush(proceso);
  });

  it('actualiza un proceso con la versión consultada', () => {
    const datos: EditarProceso = {
      nombre: 'Compras',
      descripcion: 'Nueva descripción',
      categoria: null,
      estadoPublicacion: 'BORRADOR',
      version: 3
    };
    servicio.actualizar(7, datos).subscribe(proceso => expect(proceso.version).toBe(4));

    const consulta = peticiones.expectOne('/api/procesos/7');
    expect(consulta.request.method).toBe('PUT');
    expect(consulta.request.body).toEqual(datos);
    consulta.flush({ ...proceso, ...datos, version: 4 });
  });

  it('combina filtros con paginación sin perder la consulta de inactivos', () => {
    servicio.listar(2, { nombre: 'Compra & venta', categoria: 'Área técnica',
      estado: 'BORRADOR', activo: false }).subscribe();
    const consulta = peticiones.expectOne(p => p.url === '/api/procesos');
    expect(consulta.request.params.get('pagina')).toBe('2');
    expect(consulta.request.params.get('nombre')).toBe('Compra & venta');
    expect(consulta.request.params.get('categoria')).toBe('Área técnica');
    expect(consulta.request.params.get('estado')).toBe('BORRADOR');
    expect(consulta.request.params.get('activo')).toBe('false');
    consulta.flush({ contenido: [], pagina: 2, tamanio: 10, total: 0, paginas: 0 });
  });

  it('retira con confirmación y versión y consulta el historial por su ruta', () => {
    servicio.retirar({ ...proceso, version: 9 }).subscribe();
    const retirada = peticiones.expectOne('/api/procesos/7');
    expect(retirada.request.method).toBe('DELETE');
    expect(retirada.request.body).toEqual({ version: 9, confirmar: true });
    retirada.flush(null, { status: 204, statusText: 'No Content' });
    servicio.historial(7).subscribe();
    peticiones.expectOne('/api/procesos/7/historial').flush([]);
  });
});
