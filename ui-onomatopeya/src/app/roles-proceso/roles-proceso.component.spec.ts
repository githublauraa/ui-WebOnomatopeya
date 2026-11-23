import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { AuthService } from '../services/auth.service';
import { RolesProcesoComponent } from './roles-proceso.component';

describe('RolesProcesoComponent', () => {
  let peticiones: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesProcesoComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    peticiones = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).usuario.set({
      id: 1, empresaId: 1, nombre: 'Ana', correo: 'ana@example.com',
      rolAcceso: 'ADMINISTRADOR', estado: 'ACTIVO', fechaCreacion: '', version: 0
    });
  });

  afterEach(() => peticiones.verify());

  it('busca roles por nombre desde la primera página', async () => {
    const vista = TestBed.createComponent(RolesProcesoComponent);
    vista.detectChanges();
    peticiones.expectOne('/api/roles-proceso?nombre=&pagina=0&tamanio=20').flush({
      contenido: [], pagina: 0, tamanio: 20, total: 0, paginas: 0
    });
    await vista.whenStable();
    vista.detectChanges();

    const formulario = (vista.nativeElement as HTMLElement).querySelector<HTMLFormElement>('#busquedaRoles');
    const nombre = formulario?.querySelector<HTMLInputElement>('#nombreBusquedaRol');
    expect(formulario).not.toBeNull();
    expect(nombre).not.toBeNull();

    nombre!.value = '  Analista  ';
    nombre!.dispatchEvent(new Event('input', { bubbles: true }));
    vista.detectChanges();
    expect(vista.componentInstance.nombreBusqueda.value).toBe('  Analista  ');
    vista.debugElement.query(By.css('#busquedaRoles')).triggerEventHandler('ngSubmit');

    peticiones.expectOne('/api/roles-proceso?nombre=Analista&pagina=0&tamanio=20').flush({
      contenido: [], pagina: 0, tamanio: 20, total: 21, paginas: 2
    });
    await vista.whenStable();
    vista.detectChanges();

    nombre!.value = 'Gerente';
    nombre!.dispatchEvent(new Event('input', { bubbles: true }));
    vista.detectChanges();
    const siguiente = Array.from((vista.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(boton => boton.textContent?.trim() === 'Siguiente');
    siguiente!.click();

    peticiones.expectOne('/api/roles-proceso?nombre=Analista&pagina=1&tamanio=20').flush({
      contenido: [], pagina: 1, tamanio: 20, total: 21, paginas: 2
    });
  });

  it('muestra únicamente roles activos y conserva los datos de paginación', async () => {
    const vista = TestBed.createComponent(RolesProcesoComponent);
    vista.detectChanges();
    peticiones.expectOne('/api/roles-proceso?nombre=&pagina=0&tamanio=20').flush({
      contenido: [rol(1, 'Analista'), { ...rol(2, 'Retirado'), activo: false }],
      pagina: 0, tamanio: 20, total: 2, paginas: 1
    });
    await vista.whenStable();
    vista.detectChanges();

    expect(vista.componentInstance.roles.map(actual => actual.nombre)).toEqual(['Analista']);
    expect(vista.componentInstance.total).toBe(2);
    expect((vista.nativeElement as HTMLElement).textContent).toContain('Analista');
    expect((vista.nativeElement as HTMLElement).textContent).not.toContain('Retirado');
    expect((vista.nativeElement as HTMLElement).querySelector('caption')?.textContent)
      .toContain('Roles del proceso');
  });

  it('crea un rol con los datos normalizados y actualiza la lista', () => {
    const vista = TestBed.createComponent(RolesProcesoComponent);
    const componente = vista.componentInstance;
    componente.nuevo();
    componente.formulario.setValue({ nombre: '  Solicitante  ', descripcion: '  Inicia trámites  ' });

    componente.guardar();
    const crear = peticiones.expectOne('/api/roles-proceso');
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual({
      nombre: 'Solicitante', descripcion: 'Inicia trámites', version: null
    });
    crear.flush(rol(3, 'Solicitante'));
    peticiones.expectOne('/api/roles-proceso?nombre=&pagina=0&tamanio=20').flush({
      contenido: [rol(3, 'Solicitante')], pagina: 0, tamanio: 20, total: 1, paginas: 1
    });

    expect(componente.mensaje).toBe('Rol de proceso creado.');
    expect(componente.guardando).toBe(false);
  });

  it('edita un rol usando la versión consultada', () => {
    const vista = TestBed.createComponent(RolesProcesoComponent);
    const componente = vista.componentInstance;
    const actual = rol(4, 'Aprobador');
    componente.editar(actual);
    componente.formulario.patchValue({ nombre: 'Aprobador principal' });

    componente.guardar();
    const editar = peticiones.expectOne('/api/roles-proceso/4');
    expect(editar.request.method).toBe('PUT');
    expect(editar.request.body.version).toBe(2);
    editar.flush({ ...actual, nombre: 'Aprobador principal', version: 3 });
    peticiones.expectOne('/api/roles-proceso?nombre=&pagina=0&tamanio=20').flush({
      contenido: [], pagina: 0, tamanio: 20, total: 0, paginas: 0
    });

    expect(componente.mensaje).toBe('Rol de proceso actualizado.');
  });

  it('retira lógicamente el rol después de la confirmación interna', () => {
    const vista = TestBed.createComponent(RolesProcesoComponent);
    const componente = vista.componentInstance;
    const actual = rol(5, 'Auditor');
    componente.confirmarRetiro(actual);

    componente.retirar();
    const retirar = peticiones.expectOne('/api/roles-proceso/5');
    expect(retirar.request.method).toBe('DELETE');
    expect(retirar.request.body).toEqual({ version: 2, confirmar: true });
    retirar.flush(null);
    peticiones.expectOne('/api/roles-proceso?nombre=&pagina=0&tamanio=20').flush({
      contenido: [], pagina: 0, tamanio: 20, total: 0, paginas: 0
    });

    expect(componente.retirando).toBeNull();
    expect(componente.mensaje).toContain('sin eliminar su historial');
  });

  it('muestra los errores del backend y permite limpiar la búsqueda', () => {
    const vista = TestBed.createComponent(RolesProcesoComponent);
    const componente = vista.componentInstance;
    componente.nombreBusqueda.setValue('Analista');
    componente.buscar();
    peticiones.expectOne('/api/roles-proceso?nombre=Analista&pagina=0&tamanio=20').flush(
      { detail: 'No fue posible consultar los roles.' },
      { status: 500, statusText: 'Server Error' }
    );
    expect(componente.error).toBe('No fue posible consultar los roles.');

    componente.limpiarBusqueda();
    peticiones.expectOne('/api/roles-proceso?nombre=&pagina=0&tamanio=20').flush({
      contenido: [], pagina: 0, tamanio: 20, total: 0, paginas: 0
    });
    expect(componente.nombreBusqueda.value).toBe('');
  });

  function rol(id: number, nombre: string) {
    return {
      id, nombre, descripcion: 'Descripción', activo: true, version: 2, procesosEnUso: []
    };
  }
});
