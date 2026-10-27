import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { DiagramaComponent } from './diagrama';

describe('DiagramaComponent', () => {
  let peticiones: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagramaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } }
      ]
    }).compileComponents();
    peticiones = TestBed.inject(HttpTestingController);
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
    peticiones.expectOne('/api/procesos/7/diagrama').flush(diagrama);
    await vista.whenStable();
    vista.detectChanges();

    (vista.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
    vista.detectChanges();
    await vista.whenStable();
    expect((vista.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled)
      .toBe(true);
    const campo = (vista.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>('textarea')!;
    campo.value = 'Descripción nueva';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    await vista.whenStable();
    vista.detectChanges();
    expect(vista.componentInstance.descripcionEditada).toBe('Descripción nueva');
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

    peticiones.expectOne('/api/procesos/7/diagrama').flush(
      { detail: 'No tienes acceso a este proceso.' },
      { status: 403, statusText: 'Forbidden' }
    );
    await vista.whenStable();
    vista.detectChanges();

    expect((vista.nativeElement as HTMLElement).textContent)
      .toContain('No tienes acceso a este proceso.');
  });
});
