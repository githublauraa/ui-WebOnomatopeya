import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Diagrama } from '../../models/diagrama.model';
import { MensajeriaService } from '../../services/mensajeria.service';
import { MensajeriaComponent } from './mensajeria.component';

describe('MensajeriaComponent', () => {
  const diagrama: Diagrama = {
    proceso: { id: 7, empresaId: 1, creadorId: 2, nombre: 'Compras', descripcion: null,
      categoria: null, estadoPublicacion: 'BORRADOR', activo: true,
      fechaCreacion: '2026-10-27T10:00:00Z', version: 0 },
    pools: [{ id: 1, nombre: 'Empresa', tipoParticipante: 'EMPRESA', propietario: true,
      cajaNegra: false, posicionX: 0, posicionY: 0, ancho: 500, alto: 300, orden: 1, version: 0 }],
    lanes: [],
    nodos: [{ id: 4, clase: 'EVENTO', poolId: 1, nombre: 'Enviar pedido', posicionX: 10,
      posicionY: 10, ancho: 80, alto: 50, estado: 'ACTIVO', laneId: null,
      tipoActividad: null, tipoGateway: null, direccionGateway: null, tipoEvento: 'INTERMEDIO',
      naturalezaEvento: 'MENSAJE', operacionMensaje: 'ENVIO' }],
    arcos: [], mensajes: [], flujos: [], advertencias: []
  };
  const servicio = {
    crearMensaje: vi.fn(() => of({})), actualizarMensaje: vi.fn(() => of({})),
    retirarMensaje: vi.fn(() => of(void 0)), crearCampo: vi.fn(() => of({})),
    actualizarCampo: vi.fn(() => of({})), retirarCampo: vi.fn(() => of(void 0)),
    crearUso: vi.fn(() => of({})), retirarUso: vi.fn(() => of(void 0)),
    crearFlujo: vi.fn(() => of({})), actualizarFlujo: vi.fn(() => of({})),
    retirarFlujo: vi.fn(() => of(void 0))
  };
  let fixture: ComponentFixture<MensajeriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensajeriaComponent],
      providers: [{ provide: MensajeriaService, useValue: servicio }]
    }).compileComponents();
    fixture = TestBed.createComponent(MensajeriaComponent);
    fixture.componentRef.setInput('diagrama', diagrama);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();
  });

  it('crea un mensaje usando el nodo y los datos del formulario', () => {
    fixture.componentInstance.formularioMensaje.patchValue({
      nodoId: 4, nombre: 'Pedido', sentido: 'ENVIO', correlacionTipo: 'NEGOCIO',
      correlacionNegocio: 'numeroPedido'
    });

    fixture.componentInstance.guardarMensaje();

    expect(servicio.crearMensaje).toHaveBeenCalledWith(7, expect.objectContaining({
      nodoId: 4, nombre: 'Pedido', correlacionNegocio: 'numeroPedido'
    }));
  });

  it('no muestra formularios de edición al usuario de lectura', () => {
    fixture.componentRef.setInput('editable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('bloquea nodo y sentido al editar una declaración existente', () => {
    const detalle = {
      mensaje: { id: 2, nodoId: 4, sentido: 'ENVIO' as const, nombre: 'Pedido',
        origenExterno: false, correlacionTipo: null, correlacionNegocio: null,
        correlacionCampoId: null, politicaSinCorrespondencia: null, activo: true, version: 1 },
      campos: [], usos: []
    };

    fixture.componentInstance.editarMensaje(detalle);

    expect(fixture.componentInstance.formularioMensaje.controls.nodoId.disabled).toBe(true);
    expect(fixture.componentInstance.formularioMensaje.controls.sentido.disabled).toBe(true);
  });

  it('no permite retirar mensajes a un editor', () => {
    const detalle = {
      mensaje: { id: 2, nodoId: 4, sentido: 'ENVIO' as const, nombre: 'Pedido',
        origenExterno: false, correlacionTipo: null, correlacionNegocio: null,
        correlacionCampoId: null, politicaSinCorrespondencia: null, activo: true, version: 1 },
      campos: [], usos: []
    };
    fixture.componentRef.setInput('retirable', false);

    fixture.componentInstance.retirarMensaje(detalle);

    expect(servicio.retirarMensaje).not.toHaveBeenCalled();
  });

  it('solo ofrece actividades del mismo pool para mensajes recibidos', () => {
    const detalle = {
      mensaje: { id: 2, nodoId: 4, sentido: 'RECEPCION' as const, nombre: 'Pedido',
        origenExterno: false, correlacionTipo: null, correlacionNegocio: null,
        correlacionCampoId: null, politicaSinCorrespondencia: null, activo: true, version: 1 },
      campos: [], usos: []
    };
    fixture.componentInstance.diagrama.nodos.push(
      { ...fixture.componentInstance.diagrama.nodos[0], id: 5, clase: 'ACTIVIDAD',
        tipoActividad: 'TAREA', naturalezaEvento: null, operacionMensaje: null },
      { ...fixture.componentInstance.diagrama.nodos[0], id: 6, poolId: 99, clase: 'ACTIVIDAD',
        tipoActividad: 'TAREA', naturalezaEvento: null, operacionMensaje: null }
    );
    fixture.componentInstance.seleccionarMensaje(detalle);

    expect(fixture.componentInstance.actividadesUso.map(actividad => actividad.id)).toEqual([5]);
  });
});
