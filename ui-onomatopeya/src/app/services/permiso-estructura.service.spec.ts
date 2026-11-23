import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PermisoEstructuraService } from './permiso-estructura.service';

describe('PermisoEstructuraService', () => {
  let servicio: PermisoEstructuraService;
  let peticiones: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    servicio = TestBed.inject(PermisoEstructuraService);
    peticiones = TestBed.inject(HttpTestingController);
  });

  afterEach(() => peticiones.verify());

  it('lista los permisos configurados para el proceso', () => {
    servicio.listar(7).subscribe(permisos => expect(permisos.length).toBe(1));

    const consulta = peticiones.expectOne('/api/procesos/7/permisos-estructura');
    expect(consulta.request.method).toBe('GET');
    consulta.flush([{ id: 1, procesoId: 7, rolAcceso: 'EDITOR', recurso: 'POOL',
      accion: 'CREAR', permitido: true, version: 0 }]);
  });

  it('guarda un permiso con el contrato del backend', () => {
    const datos = { rolAcceso: 'EDITOR' as const, recurso: 'LANE' as const,
      accion: 'EDITAR' as const, permitido: false, version: 3 };

    servicio.guardar(7, datos).subscribe();

    const consulta = peticiones.expectOne('/api/procesos/7/permisos-estructura');
    expect(consulta.request.method).toBe('PUT');
    expect(consulta.request.body).toEqual(datos);
    consulta.flush({ id: 2, procesoId: 7, ...datos, version: 4 });
  });

  it('verifica una acción sobre un recurso', () => {
    servicio.verificar(7, 'POOL', 'RETIRAR').subscribe(respuesta => {
      expect(respuesta.permitido).toBe(false);
    });

    const consulta = peticiones.expectOne(
      '/api/procesos/7/permisos-estructura/verificar?recurso=POOL&accion=RETIRAR'
    );
    expect(consulta.request.method).toBe('GET');
    consulta.flush({ permitido: false });
  });
});
