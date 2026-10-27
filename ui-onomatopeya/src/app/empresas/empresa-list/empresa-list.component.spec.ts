import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmpresaListComponent } from './empresa-list.component';

describe('EmpresaListComponent', () => {
  it('muestra la empresa que devuelve la API', async () => {
    await TestBed.configureTestingModule({
      imports: [EmpresaListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const vista = TestBed.createComponent(EmpresaListComponent);
    const peticiones = TestBed.inject(HttpTestingController);
    vista.detectChanges();

    const consulta = peticiones.expectOne('/api/empresas');
    expect(consulta.request.method).toBe('GET');
    consulta.flush([{ id: 1, nombre: 'Empresa Uno', nit: '123', correoContacto: 'contacto@example.com' }]);
    await vista.whenStable();
    vista.detectChanges();

    const contenido = (vista.nativeElement as HTMLElement).textContent;
    expect(contenido).toContain('Empresa Uno');
    expect(contenido).toContain('123');
    expect(contenido).toContain('contacto@example.com');
    peticiones.verify();
  });
});
