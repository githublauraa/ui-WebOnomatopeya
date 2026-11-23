import { Arco, Diagrama, FlujoMensaje, Nodo, Pool } from '../../models/diagrama.model';
import { Proceso } from '../../models/proceso.model';
import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DiagramaComponent } from './diagrama';

describe('DiagramaComponent', () => {
  let peticiones: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagramaComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } }
      ]
    }).compileComponents();
    peticiones = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).usuario.set({
      id: 1, empresaId: 1, nombre: 'Ana', correo: 'ana@example.com',
      rolAcceso: 'ADMINISTRADOR', estado: 'ACTIVO', fechaCreacion: '', version: 0
    });
  });

  afterEach(() => peticiones.verify());

  it('guarda la descripción y vuelve a consultar el diagrama', async () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const diagrama = {
      proceso: {
        id: 7,
        empresaId: 1,
        creadorId: 2,
        nombre: 'Compras',
        descripcion: 'Descripción inicial',
        categoria: 'Administración',
        estadoPublicacion: 'BORRADOR',
        activo: true,
        fechaCreacion: '2026-10-27T10:00:00Z',
        version: 3
      },
      pools: [],
      lanes: [],
      nodos: [],
      arcos: [],
      mensajes: [],
      flujos: [],
      advertencias: []
    };

    vista.detectChanges();
    peticiones.match(p => p.url === '/api/roles-proceso').forEach(p => p.flush({ contenido: [], pagina: 0, paginas: 0, total: 0, tamanio: 100 }));
    peticiones.expectOne('/api/procesos/7/diagrama').flush(diagrama);
    await vista.whenStable();
    vista.detectChanges();

    (vista.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
    vista.detectChanges();
    await vista.whenStable();
    expect((vista.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled)
      .toBe(true);

    vista.componentInstance.formulario.controls.descripcion.setValue('x'.repeat(10001));
    vista.detectChanges();
    (vista.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    vista.detectChanges();
    expect(vista.componentInstance.formulario.controls.descripcion.touched).toBe(true);
    expect((vista.nativeElement as HTMLElement).textContent).toContain('10 000 caracteres');
    peticiones.expectNone('/api/procesos/7');

    const campo = (vista.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>('textarea')!;
    campo.value = 'Descripción nueva';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    await vista.whenStable();
    vista.detectChanges();
    expect(vista.componentInstance.formulario.controls.descripcion.value).toBe('Descripción nueva');
    expect((vista.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled)
      .toBe(false);
    (vista.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    const actualizacion = peticiones.expectOne('/api/procesos/7');
    expect(actualizacion.request.method).toBe('PUT');
    expect(actualizacion.request.body).toEqual({
      nombre: 'Compras',
      descripcion: 'Descripción nueva',
      categoria: 'Administración',
      estadoPublicacion: 'BORRADOR',
      version: 3
    });
    actualizacion.flush({ ...diagrama.proceso, descripcion: 'Descripción nueva', version: 4 });
    peticiones.match(p => p.url === '/api/roles-proceso').forEach(p => p.flush({ contenido: [], pagina: 0, paginas: 0, total: 0, tamanio: 100 }));
    peticiones.expectOne('/api/procesos/7/diagrama').flush({
      ...diagrama,
      proceso: { ...diagrama.proceso, descripcion: 'Descripción nueva', version: 4 }
    });
    await vista.whenStable();
    vista.detectChanges();

    expect((vista.nativeElement as HTMLElement).textContent).toContain('Descripción nueva');
  });

  it('muestra el error al consultar un diagrama', async () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    vista.detectChanges();

    peticiones.match(p => p.url === '/api/roles-proceso').forEach(p => p.flush({ contenido: [], pagina: 0, paginas: 0, total: 0, tamanio: 100 }));
    peticiones.expectOne('/api/procesos/7/diagrama').flush(
      { detail: 'No tienes acceso a este proceso.' },
      { status: 403, statusText: 'Forbidden' }
    );
    await vista.whenStable();
    vista.detectChanges();

    expect((vista.nativeElement as HTMLElement).textContent)
      .toContain('No tienes acceso a este proceso.');
  });

  it('un lector ve el diagrama sin acciones ni peticiones de escritura', async () => {
    const auth = TestBed.inject(AuthService);
    auth.usuario.update(usuario => usuario && { ...usuario, rolAcceso: 'LECTURA' });
    const vista = TestBed.createComponent(DiagramaComponent);
    vista.detectChanges();
    peticiones.expectOne('/api/procesos/7/diagrama').flush({
      proceso: { id: 7, empresaId: 1, activo: true, nombre: 'Compras' },
      pools: [{ id: 1, nombre: 'Empresa', ancho: 500, alto: 300, cajaNegra: false }],
      lanes: [{ id: 1, poolId: 1, nombre: 'Analista', orden: 1, altura: 300 }],
      nodos: [{ id: 1, poolId: 1, clase: 'ACTIVIDAD', nombre: 'Revisar', posicionX: 50,
        posicionY: 80, ancho: 140, alto: 70, laneId: 1 }],
      arcos: [], mensajes: [], flujos: [], advertencias: []
    });
    await vista.whenStable();
    vista.detectChanges();
    expect(vista.nativeElement.querySelectorAll('button').length).toBe(0);
    vista.componentInstance.iniciarEdicion();
    vista.componentInstance.iniciarCreacionPool();
    vista.componentInstance.guardarDescripcion();
    expect(vista.componentInstance.editando).toBe(false);
    expect(vista.componentInstance.creandoPool).toBe(false);
    peticiones.expectNone(p => p.method !== 'GET');
  });

  it('mueve la posición al cambiar la lane y rechaza coordenadas fuera del pool', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = {
      proceso: { id: 7, empresaId: 1, activo: true } as Proceso,
      pools: [{ id: 1, nombre: 'Empresa', tipoParticipante: 'EMPRESA', propietario: true,
        cajaNegra: false, ancho: 500, alto: 500, posicionX: 0, posicionY: 0, orden: 1, version: 0 }],
      lanes: [
        { id: 1, poolId: 1, nombre: 'Uno', rolProcesoId: 1, orden: 1, altura: 300, version: 0 },
        { id: 2, poolId: 1, nombre: 'Dos', rolProcesoId: 2, orden: 2, altura: 200, version: 0 }
      ],
      nodos: [], arcos: [], mensajes: [], flujos: [], advertencias: []
    };
    componente.iniciarCreacionNodo(componente.diagrama.pools[0]);
    componente.formularioNodo.patchValue({ nombre: 'Revisar', laneId: 2 });
    componente.cambiarLaneNodo();
    expect(componente.formularioNodo.controls.posicionY.value).toBe(380);
    componente.formularioNodo.patchValue({ posicionX: 490 });
    componente.crearNodo();
    expect(componente.errorNodo).toContain('dentro del pool');
    peticiones.expectNone(p => p.method === 'POST');
  });

  it('aplica al editor los permisos de pools y lanes que devuelve el backend', async () => {
    TestBed.inject(AuthService).usuario.update(usuario => usuario && { ...usuario, rolAcceso: 'EDITOR' });
    const vista = TestBed.createComponent(DiagramaComponent);
    vista.detectChanges();
    peticiones.match(p => p.url === '/api/roles-proceso').forEach(p =>
      p.flush({ contenido: [], pagina: 0, paginas: 0, total: 0, tamanio: 100 }));
    peticiones.expectOne('/api/procesos/7/diagrama').flush({
      proceso: { id: 7, empresaId: 1, activo: true, nombre: 'Compras' },
      pools: [], lanes: [], nodos: [], arcos: [], mensajes: [], flujos: [], advertencias: []
    });
    const permisos = peticiones.match(p => p.url.endsWith('/permisos-estructura/verificar'));
    expect(permisos.length).toBe(6);
    permisos.forEach(peticion => peticion.flush({
      permitido: peticion.request.params.get('recurso') === 'POOL'
        && peticion.request.params.get('accion') === 'CREAR'
    }));
    await vista.whenStable();
    vista.detectChanges();

    expect(vista.componentInstance.puedeCrearPool).toBe(true);
    expect(vista.componentInstance.puedeEditarPool).toBe(false);
    expect(vista.componentInstance.puedeCrearLane).toBe(false);
  });

  it('crea y actualiza pools y lanes con los datos exigidos por la API', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();

    componente.iniciarCreacionPool();
    componente.formularioPool.patchValue({ nombre: 'Proveedor', tipoParticipante: 'PROVEEDOR' });
    componente.guardarPool();
    const crearPool = peticiones.expectOne('/api/procesos/7/pools');
    expect(crearPool.request.method).toBe('POST');
    expect(crearPool.request.body.nombre).toBe('Proveedor');
    crearPool.flush(componente.diagrama.pools[0]);
    responderRecarga();

    const pool = componente.diagrama!.pools[0];
    componente.iniciarEdicionPool(pool);
    componente.formularioPool.patchValue({ nombre: 'Empresa actualizada' });
    componente.guardarPool();
    const editarPool = peticiones.expectOne('/api/procesos/7/pools/10');
    expect(editarPool.request.body.version).toBe(2);
    editarPool.flush({ ...pool, nombre: 'Empresa actualizada' });
    responderRecarga();

    componente.roles = [{
      id: 5, nombre: 'Analista', descripcion: '', activo: true, version: 0, procesosEnUso: []
    }];
    componente.iniciarCreacionLane(componente.diagrama!.pools[0]);
    componente.guardarLane();
    const crearLane = peticiones.expectOne('/api/procesos/7/pools/10/lanes');
    expect(crearLane.request.body).toEqual({ rolProcesoId: 5, orden: 3, altura: 200 });
    crearLane.flush(componente.diagrama!.lanes[0]);
    responderRecarga();

    const lane = componente.diagrama!.lanes[0];
    componente.iniciarEdicionLane(lane);
    componente.formularioLane.patchValue({ altura: 240 });
    componente.guardarLane();
    const editarLane = peticiones.expectOne('/api/procesos/7/pools/10/lanes/20');
    expect(editarLane.request.body).toEqual({ rolProcesoId: 5, orden: 1, altura: 240, version: 3 });
    editarLane.flush({ ...lane, altura: 240 });
    responderRecarga();

    expect(componente.aviso).toBe('Lane actualizada correctamente.');

    function responderRecarga(): void {
      peticiones.expectOne('/api/procesos/7/diagrama').flush(diagramaBase());
    }
  });

  it('crea actividades, gateways y eventos con los campos propios de cada clase', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();
    const pool = componente.diagrama.pools[0];

    componente.iniciarCreacionNodo(pool);
    componente.formularioNodo.patchValue({ nombre: 'Registrar solicitud' });
    componente.guardarNodo();
    const actividad = peticiones.expectOne('/api/procesos/7/nodos');
    expect(actividad.request.body).toMatchObject({
      clase: 'ACTIVIDAD', poolId: 10, laneId: 20, tipoActividad: 'TAREA'
    });
    actividad.flush(componente.diagrama.nodos[0]);
    responderRecarga();

    componente.iniciarCreacionNodo(pool);
    componente.formularioNodo.patchValue({
      clase: 'GATEWAY', nombre: '¿Aprobado?', tipoGateway: 'INCLUSIVO', direccionGateway: 'DIVERGENCIA'
    });
    componente.guardarNodo();
    const gateway = peticiones.expectOne('/api/procesos/7/nodos');
    expect(gateway.request.body).toMatchObject({
      clase: 'GATEWAY', tipoGateway: 'INCLUSIVO', direccionGateway: 'DIVERGENCIA'
    });
    gateway.flush(componente.diagrama.nodos[1]);
    responderRecarga();

    componente.iniciarCreacionNodo(pool);
    componente.formularioNodo.patchValue({
      clase: 'EVENTO', nombre: 'Aviso recibido', tipoEvento: 'INTERMEDIO',
      naturalezaEvento: 'MENSAJE', operacionMensaje: 'RECEPCION'
    });
    componente.guardarNodo();
    const evento = peticiones.expectOne('/api/procesos/7/nodos');
    expect(evento.request.body).toMatchObject({
      clase: 'EVENTO', tipoEvento: 'INTERMEDIO', naturalezaEvento: 'MENSAJE', operacionMensaje: 'RECEPCION'
    });
    evento.flush(componente.diagrama.nodos[2]);
    responderRecarga();

    function responderRecarga(): void {
      peticiones.expectOne('/api/procesos/7/diagrama').flush(diagramaBase());
    }
  });

  it('valida que los nodos permanezcan dentro del pool y de su lane', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();
    componente.iniciarCreacionNodo(componente.diagrama.pools[0]);

    componente.formularioNodo.patchValue({ nombre: 'Fuera', posicionX: 590, ancho: 140 });
    componente.crearNodo();
    expect(componente.errorNodo).toContain('dentro del pool');

    componente.formularioNodo.patchValue({ posicionX: 10, posicionY: 180, alto: 70, laneId: 20 });
    componente.crearNodo();
    expect(componente.errorNodo).toContain('dentro de su lane');
    peticiones.expectNone(peticion => peticion.method === 'POST');
  });

  it('actualiza una posición sin reconstruir el diagrama completo', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();
    const actividad = componente.diagrama.nodos[0];

    componente.moverNodoEnLienzo({ nodo: actividad, posicionX: 180, posicionY: 230, laneId: 21 });
    const actualizacion = peticiones.expectOne('/api/procesos/7/nodos/30');
    expect(actualizacion.request.method).toBe('PUT');
    expect(actualizacion.request.body).toMatchObject({ posicionX: 180, posicionY: 230, laneId: 21 });
    actualizacion.flush({ ...actividad, posicionX: 180, posicionY: 230, laneId: 21 });

    expect(componente.diagrama.nodos.find(nodo => nodo.id === 30)?.posicionX).toBe(180);
    expect(componente.movimientoFinalizado?.nodoId).toBe(30);
    peticiones.expectNone('/api/procesos/7/diagrama');
  });

  it('impide arcos inválidos y crea una conexión válida entre nodos del mismo pool', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();

    componente.iniciarCreacionArco(componente.diagrama.pools[0]);
    componente.formularioArco.patchValue({ origenId: 31, destinoId: 30, condicionSalida: '' });
    componente.crearArco();
    expect(componente.errorArco).toContain('requiere una condición');

    componente.formularioArco.patchValue({ origenId: 30, destinoId: 32, condicionSalida: 'monto > 0' });
    componente.crearArco();
    expect(componente.errorArco).toContain('Solo las salidas de gateway');

    componente.formularioArco.patchValue({ origenId: 31, destinoId: 32, condicionSalida: 'aprobado' });
    componente.crearArco();
    const solicitud = peticiones.expectOne('/api/procesos/7/arcos');
    expect(solicitud.request.body).toEqual({
      origenId: 31, destinoId: 32, etiqueta: null, condicionSalida: 'aprobado'
    });
    solicitud.flush(componente.diagrama.arcos[0]);
    peticiones.expectOne('/api/procesos/7/diagrama').flush(diagramaBase());
  });

  it('agrega una conexión visual válida sin recargar los demás elementos', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();
    const cantidadInicial = componente.diagrama.arcos.length;

    componente.crearConexionEnLienzo({ origenId: 30, destinoId: 31 });
    const solicitud = peticiones.expectOne('/api/procesos/7/arcos');
    expect(solicitud.request.body).toEqual({
      origenId: 30, destinoId: 31, etiqueta: '', condicionSalida: ''
    });
    solicitud.flush({ id: 99, poolId: 10, origenId: 30, destinoId: 31, etiqueta: null, condicionSalida: null });

    expect(componente.diagrama.arcos).toHaveLength(cantidadInicial + 1);
    peticiones.expectNone('/api/procesos/7/diagrama');
  });

  it('retira estructuras con confirmación y conserva el historial', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();

    componente.retirarPool(componente.diagrama.pools[0]);
    const pool = peticiones.expectOne('/api/procesos/7/pools/10');
    expect(pool.request.body).toEqual({ version: 2, confirmar: true });
    pool.flush(null);
    responderRecarga();

    componente.retirarLane(componente.diagrama!.lanes[0]);
    const lane = peticiones.expectOne('/api/procesos/7/pools/10/lanes/20');
    expect(lane.request.body).toEqual({ version: 3, confirmar: true });
    lane.flush(null);
    responderRecarga();

    componente.retirarNodo(componente.diagrama!.nodos[0]);
    const nodo = peticiones.expectOne('/api/procesos/7/nodos/30');
    expect(nodo.request.body).toEqual({ version: 4, confirmar: true });
    nodo.flush([]);
    responderRecarga();

    componente.retirarArco(componente.diagrama!.arcos[0]);
    const arco = peticiones.expectOne('/api/procesos/7/arcos/40');
    expect(arco.request.body).toEqual({ version: 4, confirmar: true });
    arco.flush([]);
    responderRecarga();

    function responderRecarga(): void {
      peticiones.expectOne('/api/procesos/7/diagrama').flush(diagramaBase());
    }
  });

  it('presenta nombres, posiciones y correlación de los flujos de mensaje', () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    const componente = vista.componentInstance;
    componente.diagrama = diagramaBase();
    const flujo: FlujoMensaje = {
      id: 80, procesoId: 7, poolOrigenId: 10, poolDestinoId: null,
      nodoOrigenId: 32, nodoDestinoId: null, tipoDestino: 'CORREO', politicaFallo: 'CONTINUAR',
      actividadErrorId: null, activo: true, version: 0
    };

    expect(componente.lanesDePool(10).map(lane => lane.id)).toEqual([20, 21]);
    expect(componente.nodosDePool(10)).toHaveLength(3);
    expect(componente.arcosDePool(10)).toHaveLength(1);
    expect(componente.altoLienzo(componente.diagrama.pools[0])).toBe(400);
    expect(componente.anchoLienzo(componente.diagrama.pools[0])).toBe(620);
    expect(componente.nombrePool(null)).toBe('participante externo');
    expect(componente.nombreNodo(999)).toBe('Nodo 999');
    expect(componente.etiquetaFlujo(flujo)).toBe('Solicitud enviada');
    expect(componente.correlacionFlujo(flujo)).toBe('radicado');
  });

  it('presenta los formularios y estados completos del editor del diagrama', async () => {
    const vista = TestBed.createComponent(DiagramaComponent);
    vista.detectChanges();
    peticiones.match(peticion => peticion.url === '/api/roles-proceso').forEach(peticion => peticion.flush({
      contenido: [{
        id: 5, nombre: 'Analista', descripcion: '', activo: true, version: 0, procesosEnUso: []
      }],
      pagina: 0, paginas: 1, total: 1, tamanio: 100
    }));
    const datos = diagramaBase();
    datos.pools.push({
      ...datos.pools[0], id: 11, nombre: 'Proveedor', propietario: false, cajaNegra: true, orden: 2
    });
    datos.flujos.push({
      id: 80, procesoId: 7, poolOrigenId: 10, poolDestinoId: 11, nodoOrigenId: 32,
      nodoDestinoId: null, tipoDestino: 'CORREO', politicaFallo: 'CONTINUAR',
      actividadErrorId: null, activo: true, version: 0
    });
    datos.advertencias.push('El flujo externo no tiene nodo de recepción.');
    peticiones.expectOne('/api/procesos/7/diagrama').flush(datos);
    await vista.whenStable();

    const componente = vista.componentInstance;
    componente.roles = [{
      id: 5, nombre: 'Analista', descripcion: '', activo: true, version: 0, procesosEnUso: []
    }];
    await pulsar('Editar descripción');
    await pulsar('Agregar pool');
    await pulsar('Agregar lane');
    await pulsar('Agregar nodo');
    await pulsar('Conectar nodos');
    componente.errorPool = 'Revisa el pool.';
    componente.errorLane = 'Revisa la lane.';
    componente.errorNodo = 'Revisa el nodo.';
    componente.errorArco = 'Revisa el arco.';
    componente.aviso = 'Cambios guardados.';
    componente.formularioPool.markAllAsTouched();
    componente.formularioLane.markAllAsTouched();
    componente.formularioNodo.markAllAsTouched();
    vista.changeDetectorRef.markForCheck();
    vista.detectChanges();
    await vista.whenStable();
    vista.detectChanges();

    let texto = (vista.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Nuevo pool');
    expect(texto).toContain('Nueva lane');
    expect(texto).toContain('Nuevo nodo');
    expect(texto).toContain('Nuevo arco');
    expect(texto).toContain('Mensajes entre participantes');
    expect(texto).toContain('El flujo externo no tiene nodo de recepción.');
    expect(texto).toContain('Caja negra');

    componente.formularioNodo.patchValue({ clase: 'GATEWAY' });
    componente.iniciarEdicionPool(componente.diagrama!.pools[0]);
    componente.iniciarEdicionLane(componente.diagrama!.lanes[0]);
    componente.iniciarEdicionNodo(componente.diagrama!.nodos[1]);
    componente.iniciarEdicionArco(componente.diagrama!.arcos[0]);
    componente.guardandoPool = true;
    componente.guardandoLane = true;
    componente.guardandoNodo = true;
    componente.guardandoArco = true;
    vista.changeDetectorRef.markForCheck();
    vista.detectChanges();
    await vista.whenStable();
    vista.detectChanges();
    texto = (vista.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Editar pool');
    expect(texto).toContain('Editar lane');
    expect(texto).toContain('Tipo de gateway');
    expect(texto).toContain('Guardando...');

    componente.formularioNodo.patchValue({ clase: 'EVENTO', naturalezaEvento: 'MENSAJE' });
    vista.changeDetectorRef.markForCheck();
    vista.detectChanges();
    await vista.whenStable();
    vista.detectChanges();
    texto = (vista.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Tipo de evento');
    expect(texto).toContain('Operación de mensaje');

    async function pulsar(textoBoton: string): Promise<void> {
      const boton = Array.from((vista.nativeElement as HTMLElement).querySelectorAll('button'))
        .find(actual => actual.textContent?.trim() === textoBoton);
      expect(boton, `No se encontró el botón ${textoBoton}`).toBeDefined();
      boton!.click();
      await vista.whenStable();
      vista.detectChanges();
    }
  });

  function diagramaBase(): Diagrama {
    const proceso: Proceso = {
      id: 7, empresaId: 1, creadorId: 1, nombre: 'Compras', descripcion: 'Proceso de compras',
      categoria: 'Administración', estadoPublicacion: 'BORRADOR', activo: true,
      fechaCreacion: '2026-11-20T10:00:00Z', version: 4
    };
    const pool: Pool = {
      id: 10, nombre: 'Empresa', tipoParticipante: 'EMPRESA', propietario: true,
      cajaNegra: false, posicionX: 0, posicionY: 0, ancho: 600, alto: 400, orden: 1, version: 2
    };
    const actividad: Nodo = {
      id: 30, clase: 'ACTIVIDAD', poolId: 10, nombre: 'Registrar', posicionX: 40, posicionY: 60,
      ancho: 140, alto: 70, estado: 'ACTIVO', laneId: 20, tipoActividad: 'TAREA',
      tipoGateway: null, direccionGateway: null, tipoEvento: null, naturalezaEvento: null,
      operacionMensaje: null
    };
    const gateway: Nodo = {
      ...actividad, id: 31, clase: 'GATEWAY', nombre: '¿Aprobado?', posicionX: 230,
      laneId: null, tipoActividad: null, tipoGateway: 'EXCLUSIVO', direccionGateway: 'DIVERGENCIA'
    };
    const evento: Nodo = {
      ...actividad, id: 32, clase: 'EVENTO', nombre: 'Enviar aviso', posicionX: 430,
      laneId: null, tipoActividad: null, tipoEvento: 'FIN', naturalezaEvento: 'MENSAJE',
      operacionMensaje: 'ENVIO'
    };
    const arco: Arco = {
      id: 40, poolId: 10, origenId: 31, destinoId: 32, etiqueta: 'Sí', condicionSalida: 'aprobado'
    };
    return {
      proceso,
      pools: [pool],
      lanes: [
        { id: 20, poolId: 10, rolProcesoId: 5, nombre: 'Solicitante', orden: 1, altura: 200, version: 3 },
        { id: 21, poolId: 10, rolProcesoId: 6, nombre: 'Aprobador', orden: 2, altura: 200, version: 1 }
      ],
      nodos: [actividad, gateway, evento],
      arcos: [arco],
      mensajes: [{
        mensaje: {
          id: 70, nodoId: 32, sentido: 'ENVIO', nombre: 'Solicitud enviada', origenExterno: false,
          correlacionTipo: 'NEGOCIO', correlacionNegocio: 'radicado', correlacionCampoId: null,
          politicaSinCorrespondencia: null, activo: true, version: 0
        },
        campos: [], usos: []
      }],
      flujos: [], advertencias: []
    };
  }
});
