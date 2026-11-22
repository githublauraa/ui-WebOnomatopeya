import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RolProcesoService } from './rol-proceso.service';

describe('Roles BPMN: contrato CRUD', () => {
  let servicio: RolProcesoService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    servicio = TestBed.inject(RolProcesoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('crea un rol', () => {
    servicio.crear({nombre:'Compras', descripcion:'Responsable de compras',version:null}).subscribe();
    const r = http.expectOne('/api/roles-proceso');
    expect(r.request.method).toBe('POST');
    expect(r.request.body.nombre).toBe('Compras');
    r.flush({id:1, nombre:'Compras', activo:true,version:0,procesosEnUso:[]});
  });
  it('actualiza con versión y retira con confirmación', () => {
    servicio.actualizar(8,{nombre:'Ventas',descripcion:'',version:2}).subscribe();
    const u = http.expectOne('/api/roles-proceso/8');
    expect(u.request.method).toBe('PUT');
    expect(u.request.body.version).toBe(2);
    u.flush({id:8,nombre:'Ventas',version:3,procesosEnUso:[]});
    servicio.retirar(8,{version:3,confirmar:true}).subscribe();
    const d = http.expectOne('/api/roles-proceso/8');
    expect(d.request.method).toBe('DELETE');
    expect(d.request.body).toEqual({version:3,confirmar:true});
    d.flush(null,{status:204,statusText:'No Content'});
  });
});
