import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaProcesos } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly url = `${environment.apiUrl}/procesos`;

  constructor(private http: HttpClient) {}

  listar(pagina = 0): Observable<PaginaProcesos> {
    const params = new HttpParams().set('pagina', pagina).set('tamanio', 10);
    return this.http.get<PaginaProcesos>(this.url, { params });
  }
}
