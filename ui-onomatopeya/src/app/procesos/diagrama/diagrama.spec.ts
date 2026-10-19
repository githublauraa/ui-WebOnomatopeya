import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { DiagramaComponent } from './diagrama';

describe('DiagramaComponent', () => {
  it('muestra el error al consultar un diagrama', async () => {
    await TestBed.configureTestingModule({
      imports: [DiagramaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } }
      ]
    }).compileComponents();

    const vista = TestBed.createComponent(DiagramaComponent);
    vista.detectChanges();

    const peticiones = TestBed.inject(HttpTestingController);
    peticiones.expectOne('/api/procesos/7/diagrama').flush(
      { detail: 'No tienes acceso a este proceso.' },
      { status: 403, statusText: 'Forbidden' }
    );
    await vista.whenStable();
    vista.detectChanges();

    expect((vista.nativeElement as HTMLElement).textContent)
      .toContain('No tienes acceso a este proceso.');
    peticiones.verify();
  });
});
