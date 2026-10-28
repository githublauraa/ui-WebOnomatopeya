import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuarioService } from './usuario.service';

describe('HU-02/03 contratos de usuarios', () => {
  let servicio: UsuarioService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    servicio = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('acepta invitación pública con token y contraseña', () => {
    const token = 'A'.repeat(43);
    servicio.aceptarInvitacion({token, contrasena:'ClaveSegura123!'}).subscribe();
    const r = http.expectOne('/api/usuarios/invitaciones/aceptar');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({token, contrasena:'ClaveSegura123!'});
    r.flush({ id: 10, estado:'ACTIVO' });
  });

  it('cambia rol con control de versión', () => {
    servicio.cambiarRol(21, {rolAcceso:'EDITOR', version:7}).subscribe();
    const r = http.expectOne('/api/usuarios/21/rol');
    expect(r.request.method).toBe('PATCH');
    expect(r.request.body).toEqual({rolAcceso:'EDITOR', version:7});
    r.flush({id:21, rolAcceso:'EDITOR', version:8});
  });
});
