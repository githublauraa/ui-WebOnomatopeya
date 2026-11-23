import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PermisoEstructuraService } from '../../services/permiso-estructura.service';
import { ProcesoService } from '../../services/proceso.service';
import { ConfiguracionProcesoComponent } from './configuracion-proceso.component';

describe('ConfiguracionProcesoComponent', () => {
  const proceso = { id: 7, empresaId: 1, creadorId: 2, nombre: 'Compras', descripcion: null,
    categoria: null, estadoPublicacion: 'BORRADOR' as const, activo: true,
    fechaCreacion: '2026-01-01T00:00:00Z', version: 3 };
  const procesos = { consultar: vi.fn(() => of(proceso)), compartir: vi.fn(() => of({})) };
  const permisos = { listar: vi.fn(() => of([])), guardar: vi.fn(datos => of({ id: 1, procesoId: 7, ...datos })) };
  let fixture: ComponentFixture<ConfiguracionProcesoComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ConfiguracionProcesoComponent],
      providers: [provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
        { provide: ProcesoService, useValue: procesos },
        { provide: PermisoEstructuraService, useValue: permisos }]
    }).compileComponents();
    fixture = TestBed.createComponent(ConfiguracionProcesoComponent);
    fixture.detectChanges();
  });

  it('carga el proceso y sus permisos', () => {
    expect(procesos.consultar).toHaveBeenCalledWith(7);
    expect(permisos.listar).toHaveBeenCalledWith(7);
    expect(fixture.componentInstance.proceso?.nombre).toBe('Compras');
  });

  it('comparte usando la versión vigente del proceso', () => {
    fixture.componentInstance.comparticion.setValue({ empresaId: 4, permitido: true });
    fixture.componentInstance.guardarComparticion();
    expect(procesos.compartir).toHaveBeenCalledWith(7, { empresaId: 4, permitido: true, version: 3 });
  });

  it('guarda un permiso de estructura', () => {
    fixture.componentInstance.permiso.setValue({
      rolAcceso: 'EDITOR', recurso: 'POOL', accion: 'CREAR', permitido: true
    });
    fixture.componentInstance.guardarPermiso();
    expect(permisos.guardar).toHaveBeenCalledWith(7, {
      rolAcceso: 'EDITOR', recurso: 'POOL', accion: 'CREAR', permitido: true, version: undefined
    });
  });
});
