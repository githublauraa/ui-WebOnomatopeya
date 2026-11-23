import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MensajeriaService } from './mensajeria.service';

describe('MensajeriaService', () => {
  let servicio: MensajeriaService;
  let peticiones: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(MensajeriaService);
    peticiones = TestBed.inject(HttpTestingController);
  });

  afterEach(() => peticiones.verify());

  it('crea y actualiza mensajes con tipos de petición separados', () => {
    const crear = { nodoId: 4, sentido: 'ENVIO' as const, nombre: 'Pedido', origenExterno: false,
      correlacionTipo: 'NEGOCIO' as const, correlacionNegocio: 'numeroPedido',
      correlacionCampoId: null, politicaSinCorrespondencia: null };
    servicio.crearMensaje(8, crear).subscribe();
    const alta = peticiones.expectOne('/api/procesos/8/mensajes');
    expect(alta.request.method).toBe('POST');
    expect(alta.request.body).toEqual(crear);
    alta.flush({ id: 2, ...crear, activo: true, version: 0 });

    servicio.actualizarMensaje(8, 2, { ...crear, version: 3 }).subscribe();
    const edicion = peticiones.expectOne('/api/procesos/8/mensajes/2');
    expect(edicion.request.method).toBe('PUT');
    edicion.flush({ id: 2, ...crear, activo: true, version: 4 });
  });

  it('administra campos, usos y advertencias de un mensaje', () => {
    servicio.crearCampo(8, 2, { nombre: 'numero', tipoDato: 'ENTERO', orden: 1 }).subscribe();
    peticiones.expectOne('/api/procesos/8/mensajes/2/campos').flush({});

    servicio.crearUso(8, 2, { actividadId: 5 }).subscribe();
    peticiones.expectOne('/api/procesos/8/mensajes/2/usos').flush({});

    servicio.advertencias(8).subscribe();
    peticiones.expectOne('/api/procesos/8/mensajes/advertencias').flush([]);
  });

  it('administra flujos y retira conservando el historial', () => {
    const datos = { poolOrigenId: 1, poolDestinoId: 2, nodoOrigenId: 4,
      nodoDestinoId: null, tipoDestino: 'COLA' as const, politicaFallo: 'CONTINUAR' as const,
      actividadErrorId: null };
    servicio.crearFlujo(8, datos).subscribe();
    const alta = peticiones.expectOne('/api/procesos/8/flujos-mensaje');
    expect(alta.request.method).toBe('POST');
    alta.flush({ id: 3, procesoId: 8, ...datos, activo: true, version: 0 });

    servicio.retirarFlujo(8, 3, 2).subscribe();
    const retiro = peticiones.expectOne(
      '/api/procesos/8/flujos-mensaje/3?version=2&confirmar=true'
    );
    expect(retiro.request.method).toBe('DELETE');
    retiro.flush(null, { status: 204, statusText: 'No Content' });
  });
});
