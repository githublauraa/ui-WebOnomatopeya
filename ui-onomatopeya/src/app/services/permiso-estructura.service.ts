import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AccionEstructura,
  GuardarPermisoEstructura,
  PermisoEstructura,
  RecursoEstructura,
  VerificacionPermiso
} from '../models/permiso-estructura.model';

@Injectable({ providedIn: 'root' })
export class PermisoEstructuraService {
  constructor(private http: HttpClient) {}

  listar(procesoId: number): Observable<PermisoEstructura[]> {
    return this.http.get<PermisoEstructura[]>(this.url(procesoId));
  }

  guardar(procesoId: number, datos: GuardarPermisoEstructura): Observable<PermisoEstructura> {
    return this.http.put<PermisoEstructura>(this.url(procesoId), datos);
  }

  verificar(
    procesoId: number,
    recurso: RecursoEstructura,
    accion: AccionEstructura
  ): Observable<VerificacionPermiso> {
    const params = new HttpParams().set('recurso', recurso).set('accion', accion);
    return this.http.get<VerificacionPermiso>(`${this.url(procesoId)}/verificar`, { params });
  }

  private url(procesoId: number): string {
    return `${environment.apiUrl}/procesos/${procesoId}/permisos-estructura`;
  }
}
