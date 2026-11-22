import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaRolesProceso, RolProceso } from '../models/rol-proceso.model';

@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly url = `${environment.apiUrl}/roles-proceso`;

  constructor(private http: HttpClient) {}

  listar(nombre = '', pagina = 0, tamanio = 100): Observable<PaginaRolesProceso> {
    const params = new HttpParams()
      .set('nombre', nombre)
      .set('pagina', pagina)
      .set('tamanio', tamanio);
    return this.http.get<PaginaRolesProceso>(this.url, { params });
  }

  crear(datos: { nombre: string; descripcion: string; version: number | null }): Observable<RolProceso> {
    return this.http.post<RolProceso>(this.url, datos);
  }

  actualizar(id: number, datos: { nombre: string; descripcion: string; version: number }): Observable<RolProceso> {
    return this.http.put<RolProceso>(`${this.url}/${id}`, datos);
  }

  retirar(id: number, datos: { version: number; confirmar: true }): Observable<void> {
    return this.http.request<void>('DELETE', `${this.url}/${id}`, { body: datos });
  }
}
