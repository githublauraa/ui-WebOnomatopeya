import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CambioProceso, FiltrosProcesos, CrearProceso, EditarProceso, PaginaProcesos, Proceso } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly url = `${environment.apiUrl}/procesos`;

  constructor(private http: HttpClient) {}

  listar(pagina = 0, filtros?: FiltrosProcesos): Observable<PaginaProcesos> {
    let params = new HttpParams().set('pagina', pagina).set('tamanio', 10);
    if (filtros) {
      params = params.set('activo', filtros.activo);
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.categoria) params = params.set('categoria', filtros.categoria);
      if (filtros.estado) params = params.set('estado', filtros.estado);
    }
    return this.http.get<PaginaProcesos>(this.url, { params });
  }

  historial(id: number): Observable<CambioProceso[]> {
    return this.http.get<CambioProceso[]>(`${this.url}/${id}/historial`);
  }

  retirar(proceso: Proceso): Observable<void> {
    return this.http.delete<void>(`${this.url}/${proceso.id}`, {
      body: { version: proceso.version, confirmar: true }
    });
  }

  consultar(id: number): Observable<Proceso> {
    return this.http.get<Proceso>(`${this.url}/${id}`);
  }

  crear(datos: CrearProceso): Observable<Proceso> {
    return this.http.post<Proceso>(this.url, datos);
  }

  actualizar(id: number, datos: EditarProceso): Observable<Proceso> {
    return this.http.put<Proceso>(`${this.url}/${id}`, datos);
  }
}
