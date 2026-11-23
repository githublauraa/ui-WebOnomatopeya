import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { AuthService } from './services/auth.service';

describe('App', () => {
  const auth = {
    token: () => 'token',
    esAdministrador: () => false,
    cerrar: vi.fn()
  };

  beforeEach(async () => {
    auth.cerrar.mockClear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the active route', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('cierra la sesión y vuelve al login', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(App);

    fixture.componentInstance.cerrarSesion();
    await fixture.whenStable();

    expect(auth.cerrar).toHaveBeenCalledOnce();
    expect(navegar).toHaveBeenCalledWith('/login');
  });
});
