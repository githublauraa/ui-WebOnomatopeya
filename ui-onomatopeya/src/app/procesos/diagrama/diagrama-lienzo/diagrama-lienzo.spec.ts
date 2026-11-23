import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Arco, Lane, Nodo, Pool } from '../../../models/diagrama.model';
import { DiagramaLienzoComponent } from './diagrama-lienzo';

describe('DiagramaLienzoComponent', () => {
  let fixture: ComponentFixture<DiagramaLienzoComponent>;
  let componente: DiagramaLienzoComponent;

  const pool: Pool = {
    id: 10, nombre: 'Empresa', tipoParticipante: 'EMPRESA', propietario: true,
    cajaNegra: false, posicionX: 0, posicionY: 0, ancho: 600, alto: 400,
    orden: 1, version: 0
  };
  const lanes: Lane[] = [
    { id: 20, poolId: 10, rolProcesoId: 1, nombre: 'Solicitante', orden: 1, altura: 200, version: 0 },
    { id: 21, poolId: 10, rolProcesoId: 2, nombre: 'Aprobador', orden: 2, altura: 200, version: 0 }
  ];
  const nodos: Nodo[] = [
    {
      id: 30, clase: 'ACTIVIDAD', poolId: 10, nombre: 'Radicar solicitud', posicionX: 40,
      posicionY: 60, ancho: 140, alto: 70, estado: 'ACTIVO', laneId: 20,
      tipoActividad: 'TAREA', tipoGateway: null, direccionGateway: null, tipoEvento: null,
      naturalezaEvento: null, operacionMensaje: null
    },
    {
      id: 31, clase: 'EVENTO', poolId: 10, nombre: 'Fin', posicionX: 360,
      posicionY: 260, ancho: 50, alto: 50, estado: 'ACTIVO', laneId: null,
      tipoActividad: null, tipoGateway: null, direccionGateway: null, tipoEvento: 'FIN',
      naturalezaEvento: 'NORMAL', operacionMensaje: null
    }
  ];
  const arco: Arco = {
    id: 40, poolId: 10, origenId: 30, destinoId: 31, etiqueta: 'Aprobada', condicionSalida: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DiagramaLienzoComponent] }).compileComponents();
    fixture = TestBed.createComponent(DiagramaLienzoComponent);
    componente = fixture.componentInstance;
    componente.pool = pool;
    componente.lanes = lanes;
    componente.nodos = nodos;
    componente.arcos = [arco];
    fixture.detectChanges();
  });

  it('selecciona nodos y arcos sin dejar dos elementos activos', () => {
    componente.seleccionarNodo(nodos[0]);
    expect(componente.seleccionado).toEqual(nodos[0]);
    expect(componente.seleccionadoArco).toBeUndefined();

    const evento = new MouseEvent('click');
    const detener = vi.spyOn(evento, 'stopPropagation');
    componente.seleccionarArco(arco, evento);

    expect(detener).toHaveBeenCalledOnce();
    expect(componente.seleccionado).toBeUndefined();
    expect(componente.seleccionadoArco).toEqual(arco);
  });

  it('solo abre el editor cuando el lienzo tiene permisos de edición', () => {
    const emitido = vi.spyOn(componente.editarNodo, 'emit');
    const evento = new MouseEvent('dblclick');

    componente.abrirEditorNodo(nodos[0], evento);
    expect(emitido).not.toHaveBeenCalled();

    componente.editable = true;
    componente.abrirEditorNodo(nodos[0], evento);
    expect(emitido).toHaveBeenCalledWith(nodos[0]);
  });

  it('calcula posiciones, centros y etiquetas usando los datos visibles', () => {
    expect(componente.altoLienzo()).toBe(400);
    expect(componente.anchoLienzo()).toBe(600);
    expect(componente.posicionLane(lanes[1])).toBe(200);
    expect(componente.centroX(30)).toBe(110);
    expect(componente.centroY(30)).toBe(95);
    expect(componente.puntoMedioX(arco)).toBe(247.5);
    expect(componente.puntoMedioY(arco)).toBe(190);
    expect(componente.nombreNodo(31)).toBe('Fin');
    expect(componente.nombreNodo(999)).toBe('Nodo 999');
  });

  it('reduce el texto largo para mantenerlo dentro de la figura', () => {
    const corto = componente.tamanoTexto({ ...nodos[0], nombre: 'Revisar' });
    const largo = componente.tamanoTexto({
      ...nodos[0], ancho: 55, alto: 30,
      nombre: 'Solicitud extraordinariamente extensa para el espacio'
    });

    expect(corto).toBeGreaterThan(largo);
    expect(largo).toBeGreaterThanOrEqual(6);
  });

  it('mueve una actividad a otra lane y conserva la vista previa hasta confirmar', () => {
    componente.editable = true;
    const elemento = document.createElement('article');
    const padre = document.createElement('div');
    padre.appendChild(elemento);
    Object.defineProperty(elemento, 'setPointerCapture', { value: vi.fn() });
    Object.defineProperty(elemento, 'hasPointerCapture', { value: vi.fn(() => true) });
    Object.defineProperty(elemento, 'releasePointerCapture', { value: vi.fn() });
    vi.spyOn(padre, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 600, bottom: 400,
      width: 600, height: 400, toJSON: () => ({})
    });
    const emitido = vi.spyOn(componente.moverNodo, 'emit');

    componente.iniciarArrastre(pointer('pointerdown', elemento, 50, 70), nodos[0]);
    componente.moverArrastre(pointer('pointermove', elemento, 80, 260));
    componente.terminarArrastre(pointer('pointerup', elemento, 80, 260));

    expect(emitido).toHaveBeenCalledWith({ nodo: nodos[0], posicionX: 70, posicionY: 250, laneId: 21 });
    expect(componente.posicionX(nodos[0])).toBe(70);
    componente.movimientoFinalizado = { nodoId: 30, secuencia: 1 };
    expect(componente.posicionX(nodos[0])).toBe(40);
  });

  it('rechaza el movimiento si una actividad queda entre dos lanes', () => {
    componente.editable = true;
    const elemento = document.createElement('article');
    const padre = document.createElement('div');
    padre.appendChild(elemento);
    Object.defineProperty(elemento, 'setPointerCapture', { value: vi.fn() });
    vi.spyOn(padre, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 600, bottom: 400,
      width: 600, height: 400, toJSON: () => ({})
    });
    const error = vi.spyOn(componente.errorMovimiento, 'emit');

    componente.iniciarArrastre(pointer('pointerdown', elemento, 50, 70), nodos[0]);
    componente.moverArrastre(pointer('pointermove', elemento, 60, 175));
    componente.terminarArrastre(pointer('pointerup', elemento, 60, 175));

    expect(error).toHaveBeenCalledWith('La actividad debe permanecer completamente dentro de una lane.');
    expect(componente.posicionY(nodos[0])).toBe(60);
  });

  it('cancela un arrastre y descarta la posición temporal', () => {
    componente.editable = true;
    const elemento = document.createElement('article');
    const padre = document.createElement('div');
    padre.appendChild(elemento);
    Object.defineProperty(elemento, 'setPointerCapture', { value: vi.fn() });
    vi.spyOn(padre, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 600, bottom: 400,
      width: 600, height: 400, toJSON: () => ({})
    });

    componente.iniciarArrastre(pointer('pointerdown', elemento, 50, 70), nodos[0]);
    componente.moverArrastre(pointer('pointermove', elemento, 100, 90));
    expect(componente.posicionX(nodos[0])).toBe(90);
    componente.cancelarArrastre(pointer('pointercancel', elemento, 100, 90));

    expect(componente.arrastrandoNodoId).toBeNull();
    expect(componente.posicionX(nodos[0])).toBe(40);
  });

  it('crea una conexión únicamente al soltar sobre otro nodo del pool', () => {
    componente.editable = true;
    const punto = document.createElement('button');
    const destino = document.createElement('article');
    destino.setAttribute('data-nodo-id', '31');
    Object.defineProperty(punto, 'setPointerCapture', { value: vi.fn() });
    Object.defineProperty(punto, 'hasPointerCapture', { value: vi.fn(() => false) });
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => destino)
    });
    const conexion = vi.spyOn(componente.crearConexion, 'emit');

    componente.iniciarConexion(pointer('pointerdown', punto, 110, 95), nodos[0]);
    componente.terminarConexion(pointer('pointerup', punto, 385, 285));

    expect(conexion).toHaveBeenCalledWith({ origenId: 30, destinoId: 31 });
  });

  it('informa cuando una conexión termina fuera de un nodo válido', () => {
    componente.editable = true;
    const punto = document.createElement('button');
    Object.defineProperty(punto, 'setPointerCapture', { value: vi.fn() });
    Object.defineProperty(punto, 'hasPointerCapture', { value: vi.fn(() => false) });
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => document.body)
    });
    const error = vi.spyOn(componente.errorConexion, 'emit');

    componente.iniciarConexion(pointer('pointerdown', punto, 110, 95), nodos[0]);
    componente.terminarConexion(pointer('pointerup', punto, 500, 350));

    expect(error).toHaveBeenCalledOnce();
  });

  it('muestra las acciones permitidas para lanes, nodos y arcos seleccionados', async () => {
    fixture.componentRef.setInput('editable', true);
    fixture.componentRef.setInput('retirable', true);
    fixture.componentRef.setInput('laneEditable', true);
    fixture.componentRef.setInput('laneRetirable', true);
    await fixture.whenStable();
    fixture.detectChanges();

    const figura = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-nodo-id="30"]')!;
    figura.click();
    await fixture.whenStable();
    fixture.detectChanges();
    let texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Editar nodo');
    expect(texto).toContain('Retirar nodo');

    const linea = (fixture.nativeElement as HTMLElement).querySelector<SVGLineElement>('.arco-interaccion')!;
    linea.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Editar conexion');
    expect(texto).toContain('Retirar conexion');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.conector-nodo')).toHaveLength(2);
  });

  it('ignora arrastres y conexiones cuando el lienzo está bloqueado o es de consulta', () => {
    const elemento = document.createElement('button');
    Object.defineProperty(elemento, 'setPointerCapture', { value: vi.fn() });
    const movimiento = vi.spyOn(componente.moverNodo, 'emit');
    const conexion = vi.spyOn(componente.crearConexion, 'emit');

    componente.iniciarArrastre(pointer('pointerdown', elemento, 50, 70), nodos[0]);
    componente.iniciarConexion(pointer('pointerdown', elemento, 50, 70), nodos[0]);
    componente.terminarArrastre(pointer('pointerup', elemento, 100, 100));
    componente.terminarConexion(pointer('pointerup', elemento, 100, 100));

    componente.editable = true;
    componente.bloqueado = true;
    componente.iniciarArrastre(pointer('pointerdown', elemento, 50, 70), nodos[0]);
    componente.iniciarConexion(pointer('pointerdown', elemento, 50, 70), nodos[0]);

    expect(movimiento).not.toHaveBeenCalled();
    expect(conexion).not.toHaveBeenCalled();
    expect(componente.arrastrandoNodoId).toBeNull();
    expect(componente.conexionPrevia).toBeNull();
  });

  it('limita la vista previa de una conexión al tamaño del pool', () => {
    componente.editable = true;
    const lienzo = document.createElement('div');
    lienzo.className = 'lienzo-pool';
    const punto = document.createElement('button');
    lienzo.appendChild(punto);
    Object.defineProperty(punto, 'setPointerCapture', { value: vi.fn() });
    vi.spyOn(lienzo, 'getBoundingClientRect').mockReturnValue({
      x: 10, y: 20, left: 10, top: 20, right: 310, bottom: 220,
      width: 300, height: 200, toJSON: () => ({})
    });

    componente.iniciarConexion(pointer('pointerdown', punto, 50, 70), nodos[0]);
    componente.moverConexion(pointer('pointermove', punto, 500, -20));

    expect(componente.conexionPrevia).toEqual({ origenId: 30, x: 600, y: 0 });
  });

  function pointer(tipo: string, elemento: HTMLElement, x: number, y: number): PointerEvent {
    return {
      type: tipo,
      currentTarget: elemento,
      clientX: x,
      clientY: y,
      pointerId: 1,
      button: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as PointerEvent;
  }
});
