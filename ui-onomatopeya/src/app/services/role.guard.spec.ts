import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { AuthService } from './auth.service';
import { roleGuard } from './auth.guard';

describe('roleGuard', () => {
  const administrador: Usuario = {
    id: 1,
    empresaId: 10,
    nombre: 'Ana',
    correo: 'ana@example.com',
    rolAcceso: 'ADMINISTRADOR',
    estado: 'ACTIVO',
    fechaCreacion: '',
    version: 0
  };
  const usuario = signal<Usuario | null>(administrador);
  const auth = {
    token: () => 'token',
    usuario,
    cargarUsuario: vi.fn(() => of(usuario()!))
  };

  beforeEach(() => {
    usuario.set(administrador);
    auth.cargarUsuario.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    });
  });

  it('permite una ruta cuando el rol está autorizado', async () => {
    const resultado = await TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ['ADMINISTRADOR'] } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    await expect(Promise.resolve(resultado)).resolves.toBe(true);
  });

  it('redirige a procesos cuando el rol no está autorizado', async () => {
    usuario.set({ ...administrador, rolAcceso: 'LECTURA' });
    auth.cargarUsuario.mockImplementationOnce(() => of(usuario()!));
    const router = TestBed.inject(Router);

    const resultado = await TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ['ADMINISTRADOR'] } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    const valor = await Promise.resolve(resultado);
    expect(router.serializeUrl(valor as ReturnType<Router['createUrlTree']>)).toBe('/procesos');
  });
});
