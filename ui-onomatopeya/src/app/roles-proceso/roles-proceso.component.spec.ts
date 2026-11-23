import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { RolesProcesoComponent } from './roles-proceso.component';

describe('RolesProcesoComponent', () => {
  let peticiones: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesProcesoComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    peticiones = TestBed.inject(HttpTestingController);
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
});
