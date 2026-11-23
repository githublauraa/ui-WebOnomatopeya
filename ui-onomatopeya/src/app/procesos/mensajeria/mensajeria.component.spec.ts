import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
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
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MensajeriaComponent],
      providers: [{ provide: MensajeriaService, useValue: servicio }]
    }).compileComponents();
    fixture = TestBed.createComponent(MensajeriaComponent);
    fixture.componentRef.setInput('diagrama', structuredClone(diagrama));
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

  it('actualiza un mensaje y normaliza la correlación según su tipo', () => {
    const detalle = detalleMensaje();
    fixture.componentInstance.editarMensaje(detalle);
    fixture.componentInstance.formularioMensaje.patchValue({
      nombre: ' Pedido actualizado ', correlacionTipo: 'CAMPO', correlacionNegocio: 'ignorar',
      correlacionCampoId: 12
    });

    fixture.componentInstance.guardarMensaje();

    expect(servicio.actualizarMensaje).toHaveBeenCalledWith(7, 2, expect.objectContaining({
      nombre: 'Pedido actualizado', correlacionNegocio: null, correlacionCampoId: 12, version: 1
    }));
    expect(fixture.componentInstance.aviso).toBe('Mensaje actualizado.');
  });

  it('crea, actualiza y retira campos del mensaje seleccionado', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.retirable = true;
    const detalle = detalleMensaje();
    fixture.componentInstance.seleccionarMensaje(detalle);
    fixture.componentInstance.formularioCampo.setValue({ nombre: ' radicado ', tipoDato: 'TEXTO', orden: 1 });

    fixture.componentInstance.guardarCampo();
    expect(servicio.crearCampo).toHaveBeenCalledWith(7, 2, {
      nombre: 'radicado', tipoDato: 'TEXTO', orden: 1, version: undefined
    });

    const campo = {
      id: 12, mensajeId: 2, nombre: 'radicado', tipoDato: 'TEXTO' as const,
      orden: 1, activo: true, version: 3
    };
    fixture.componentInstance.editarCampo(campo);
    fixture.componentInstance.formularioCampo.patchValue({ nombre: 'código' });
    fixture.componentInstance.guardarCampo();
    expect(servicio.actualizarCampo).toHaveBeenCalledWith(7, 2, 12, {
      nombre: 'código', tipoDato: 'TEXTO', orden: 1, version: 3
    });

    fixture.componentInstance.retirarCampo(campo);
    expect(servicio.retirarCampo).toHaveBeenCalledWith(7, 2, 12, 3);
  });

  it('asocia y retira usos únicamente para mensajes de recepción', () => {
    const detalle = detalleMensaje('RECEPCION');
    fixture.componentInstance.diagrama.nodos.push({
      ...fixture.componentInstance.diagrama.nodos[0], id: 5, clase: 'ACTIVIDAD',
      tipoActividad: 'TAREA', naturalezaEvento: null, operacionMensaje: null
    });
    fixture.componentInstance.seleccionarMensaje(detalle);
    fixture.componentInstance.formularioUso.setValue({ actividadId: 5 });

    fixture.componentInstance.guardarUso();
    expect(servicio.crearUso).toHaveBeenCalledWith(7, 2, { actividadId: 5 });

    fixture.componentInstance.retirable = true;
    fixture.componentInstance.retirarUso({
      id: 22, mensajeId: 2, actividadId: 5, activo: true, version: 4
    });
    expect(servicio.retirarUso).toHaveBeenCalledWith(7, 2, 22, 4);
  });

  it('crea, actualiza y retira flujos entre pools diferentes', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.diagrama.pools.push({
      ...fixture.componentInstance.diagrama.pools[0], id: 9, nombre: 'Proveedor', propietario: false
    });
    fixture.componentInstance.nuevoFlujo();
    fixture.componentInstance.formularioFlujo.patchValue({
      poolOrigenId: 1, poolDestinoId: 9, nodoOrigenId: 4,
      tipoDestino: 'SERVICIO_WEB', politicaFallo: 'CONTINUAR'
    });

    fixture.componentInstance.guardarFlujo();
    expect(servicio.crearFlujo).toHaveBeenCalledWith(7, expect.objectContaining({
      poolOrigenId: 1, poolDestinoId: 9, nodoOrigenId: 4, tipoDestino: 'SERVICIO_WEB'
    }));

    const flujo = {
      id: 30, procesoId: 7, poolOrigenId: 1, poolDestinoId: 9, nodoOrigenId: 4,
      nodoDestinoId: null, tipoDestino: 'SERVICIO_WEB' as const, politicaFallo: 'CONTINUAR' as const,
      actividadErrorId: null, activo: true, version: 2
    };
    fixture.componentInstance.editarFlujo(flujo);
    fixture.componentInstance.formularioFlujo.patchValue({ politicaFallo: 'DERIVAR' });
    fixture.componentInstance.guardarFlujo();
    expect(servicio.actualizarFlujo).toHaveBeenCalledWith(7, 30, expect.objectContaining({
      politicaFallo: 'DERIVAR', version: 2
    }));

    fixture.componentInstance.retirable = true;
    fixture.componentInstance.retirarFlujo(flujo);
    expect(servicio.retirarFlujo).toHaveBeenCalledWith(7, 30, 2);
  });

  it('rechaza flujos que intentan comunicar un pool consigo mismo', () => {
    fixture.componentInstance.formularioFlujo.patchValue({ poolOrigenId: 1, poolDestinoId: 1 });

    fixture.componentInstance.guardarFlujo();

    expect(fixture.componentInstance.error).toContain('deben ser diferentes');
    expect(servicio.crearFlujo).not.toHaveBeenCalled();
  });

  it('muestra el error devuelto por la API y permite reintentar', () => {
    servicio.crearMensaje.mockReturnValueOnce(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { detail: 'Nombre repetido.' }
    })));
    fixture.componentInstance.formularioMensaje.patchValue({ nodoId: 4, nombre: 'Pedido' });

    fixture.componentInstance.guardarMensaje();

    expect(fixture.componentInstance.guardando).toBe(false);
    expect(fixture.componentInstance.error).toBe('Nombre repetido.');
  });

  it('filtra nodos de envío y recepción para cada extremo del flujo', () => {
    const envio = detalleMensaje('ENVIO');
    const recepcion = {
      ...detalleMensaje('RECEPCION'),
      mensaje: { ...detalleMensaje('RECEPCION').mensaje, id: 3, nodoId: 8 }
    };
    fixture.componentInstance.diagrama.nodos.push({
      ...fixture.componentInstance.diagrama.nodos[0], id: 8, operacionMensaje: 'RECEPCION'
    });
    fixture.componentInstance.diagrama.mensajes = [envio, recepcion];
    fixture.componentInstance.formularioFlujo.patchValue({ poolOrigenId: 1, poolDestinoId: 1 });

    expect(fixture.componentInstance.nodosOrigenFlujo.map(nodo => nodo.id)).toEqual([4]);
    expect(fixture.componentInstance.nodosDestinoFlujo.map(nodo => nodo.id)).toEqual([8]);
    expect(fixture.componentInstance.nombreNodo(4)).toBe('Enviar pedido');
    expect(fixture.componentInstance.nombrePool(99)).toBe('Sin pool');
  });

  function detalleMensaje(sentido: 'ENVIO' | 'RECEPCION' = 'ENVIO') {
    return {
      mensaje: {
        id: 2, nodoId: 4, sentido, nombre: 'Pedido', origenExterno: false,
        correlacionTipo: null, correlacionNegocio: null, correlacionCampoId: null,
        politicaSinCorrespondencia: null, activo: true, version: 1
      },
      campos: [],
      usos: []
    };
  }
});
