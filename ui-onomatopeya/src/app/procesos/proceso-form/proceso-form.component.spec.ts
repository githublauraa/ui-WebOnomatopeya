import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Proceso } from '../../models/proceso.model';
import { ProcesoFormComponent } from './proceso-form.component';

describe('ProcesoFormComponent', () => {
  const proceso: Proceso = {
    id: 7,
    empresaId: 1,
    creadorId: 2,
    nombre: 'Compras',
    descripcion: null,
    categoria: 'Administración',
    estadoPublicacion: 'BORRADOR',
    activo: true,
    fechaCreacion: '2026-10-27T10:00:00Z',
    version: 0
  };

  let peticiones: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'procesos/nuevo', component: ProcesoFormComponent },
          { path: 'procesos/:id/editar', component: ProcesoFormComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    peticiones = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).usuario.set({
      id: 1, empresaId: 1, nombre: 'Ana', correo: 'ana@example.com',
      rolAcceso: 'ADMINISTRADOR', estado: 'ACTIVO', fechaCreacion: '', version: 0
    });
  });

  afterEach(() => peticiones.verify());

  it('crea un borrador y muestra un enlace para consultarlo', async () => {
    const vista = await RouterTestingHarness.create();
    const formulario = await vista.navigateByUrl('/procesos/nuevo', ProcesoFormComponent);
    formulario.formulario.patchValue({ nombre: 'Compras', categoria: 'Administración' });

    formulario.guardar();
    const solicitud = peticiones.expectOne('/api/procesos');
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({
      nombre: 'Compras',
      descripcion: null,
      categoria: 'Administración',
      estadoPublicacion: 'BORRADOR'
    });
    solicitud.flush(proceso);
    vista.detectChanges();

    expect(vista.routeNativeElement?.textContent).toContain('Proceso creado: Compras (ID 7)');
    expect(vista.routeNativeElement?.querySelector('a[href="/procesos/7/diagrama"]')).toBeTruthy();
  });

  it('consulta antes de editar y envía la versión actual', async () => {
    const vista = await RouterTestingHarness.create();
    const formulario = await vista.navigateByUrl('/procesos/7/editar', ProcesoFormComponent);
    peticiones.expectOne('/api/procesos/7').flush(proceso);
    formulario.formulario.patchValue({ descripcion: 'Nueva descripción' });

    formulario.guardar();
    const solicitud = peticiones.expectOne('/api/procesos/7');
    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual({
      nombre: 'Compras',
      descripcion: 'Nueva descripción',
      categoria: 'Administración',
      estadoPublicacion: 'BORRADOR',
      version: 0
    });
    solicitud.flush({ ...proceso, descripcion: 'Nueva descripción', version: 1 });
    vista.detectChanges();

    expect(vista.routeNativeElement?.textContent).toContain('Proceso actualizado: Compras (ID 7)');
  });
});
