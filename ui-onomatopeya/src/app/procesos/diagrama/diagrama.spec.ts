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
});
