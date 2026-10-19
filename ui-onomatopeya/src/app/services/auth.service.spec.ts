import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpClient;
  let peticiones: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    peticiones = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    peticiones.verify();
    sessionStorage.clear();
  });

  it('guarda la sesión y envía el token a la API', () => {
    auth.iniciar({ correo: 'ana@ejemplo.com', contrasena: 'clave-segura' }).subscribe();
    const login = peticiones.expectOne('/api/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({
      token: 'token-de-prueba',
      tipo: 'Bearer',
      expiraEn: new Date(Date.now() + 60000).toISOString()
    });

    http.get('/api/procesos').subscribe();
    const procesos = peticiones.expectOne('/api/procesos');
    expect(procesos.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    procesos.flush({ contenido: [] });
  });

  it('descarta una sesión vencida', () => {
    sessionStorage.setItem('onomatopeya.sesion', JSON.stringify({
      token: 'vencido',
      tipo: 'Bearer',
      expiraEn: new Date(Date.now() - 60000).toISOString()
    }));

    expect(auth.token()).toBeNull();
    expect(sessionStorage.getItem('onomatopeya.sesion')).toBeNull();
  });
});
