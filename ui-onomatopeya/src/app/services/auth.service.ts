import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';
import { Proceso } from '../models/proceso.model';
import { Credenciales, Sesion } from '../models/sesion.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly claveSesion = 'onomatopeya.sesion';
  private readonly url = `${environment.apiUrl}/auth/login`;

  readonly usuario = signal<Usuario | null>(null);

  constructor(private http: HttpClient) {}

  cargarUsuario(): Observable<Usuario> {
    return this.http.get<Usuario>(`${environment.apiUrl}/auth/sesion`).pipe(
      tap(usuario => this.usuario.set(usuario))
    );
  }

  puedeEditar(proceso?: Proceso): boolean {
    const usuario = this.usuario();
    return !!usuario && usuario.estado === 'ACTIVO' && usuario.rolAcceso !== 'LECTURA'
      && (!proceso || (proceso.activo && proceso.empresaId === usuario.empresaId));
  }

  esAdministrador(proceso?: Proceso): boolean {
    return this.puedeEditar(proceso) && this.usuario()?.rolAcceso === 'ADMINISTRADOR';
  }

  iniciar(datos: Credenciales): Observable<Sesion> {
    return this.http.post<Sesion>(this.url, datos).pipe(
      tap(sesion => sessionStorage.setItem(this.claveSesion, JSON.stringify(sesion)))
    );
  }

  token(): string | null {
    const sesion = this.leerSesion();
    if (!sesion) return null;

    if (Date.parse(sesion.expiraEn) <= Date.now()) {
      this.cerrar();
      return null;
    }
    return sesion.token;
  }

  cerrar(): void {
    this.usuario.set(null);
    sessionStorage.removeItem(this.claveSesion);
  }

  private leerSesion(): Sesion | null {
    const valor = sessionStorage.getItem(this.claveSesion);
    if (!valor) return null;

    try {
      const sesion = JSON.parse(valor) as Sesion;
      if (!sesion || typeof sesion.token !== 'string' || !sesion.token ||
          typeof sesion.expiraEn !== 'string' || !Number.isFinite(Date.parse(sesion.expiraEn))) {
        this.cerrar();
        return null;
      }
      return sesion;
    } catch {
      this.cerrar();
      return null;
    }
  }
}
