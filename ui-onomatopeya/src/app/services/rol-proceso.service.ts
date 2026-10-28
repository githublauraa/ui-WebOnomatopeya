import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaRolesProceso } from '../models/rol-proceso.model';

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
}
