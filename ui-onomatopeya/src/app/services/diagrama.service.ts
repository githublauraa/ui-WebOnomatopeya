import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Arco,
  ArcoDatos,
  Diagrama,
  Lane,
  LaneCrearDatos,
  LaneEditarDatos,
  Nodo,
  NodoDatos,
  Pool,
  PoolCrearDatos,
  PoolEditarDatos,
  RetiradaDatos
} from '../models/diagrama.model';

@Injectable({
  providedIn: 'root'
})
export class DiagramaService {

  private apiUrl = `${environment.apiUrl}/procesos`;

  constructor(private http: HttpClient) {}

  obtenerDiagrama(idProceso: number): Observable<Diagrama> {
    return this.http.get<Diagrama>(
      `${this.apiUrl}/${idProceso}/diagrama`
    );
  }

  crearPool(procesoId: number, datos: PoolCrearDatos): Observable<Pool> {
    return this.http.post<Pool>(`${this.apiUrl}/${procesoId}/pools`, datos);
  }

  editarPool(procesoId: number, poolId: number, datos: PoolEditarDatos): Observable<Pool> {
    return this.http.put<Pool>(`${this.apiUrl}/${procesoId}/pools/${poolId}`, datos);
  }

  retirarPool(procesoId: number, poolId: number, datos: RetiradaDatos): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${procesoId}/pools/${poolId}`, { body: datos });
  }

  crearLane(procesoId: number, poolId: number, datos: LaneCrearDatos): Observable<Lane> {
    return this.http.post<Lane>(`${this.apiUrl}/${procesoId}/pools/${poolId}/lanes`, datos);
  }

  editarLane(procesoId: number, poolId: number, laneId: number, datos: LaneEditarDatos): Observable<Lane> {
    return this.http.put<Lane>(`${this.apiUrl}/${procesoId}/pools/${poolId}/lanes/${laneId}`, datos);
  }

  retirarLane(procesoId: number, poolId: number, laneId: number, datos: RetiradaDatos): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${procesoId}/pools/${poolId}/lanes/${laneId}`, { body: datos });
  }

  crearNodo(procesoId: number, datos: NodoDatos): Observable<Nodo> {
    return this.http.post<Nodo>(`${this.apiUrl}/${procesoId}/nodos`, datos);
  }

  editarNodo(procesoId: number, nodoId: number, datos: NodoDatos): Observable<Nodo> {
    return this.http.put<Nodo>(`${this.apiUrl}/${procesoId}/nodos/${nodoId}`, datos);
  }

  retirarNodo(procesoId: number, nodoId: number, datos: RetiradaDatos): Observable<string[]> {
    return this.http.delete<string[]>(`${this.apiUrl}/${procesoId}/nodos/${nodoId}`, { body: datos });
  }

  crearArco(procesoId: number, datos: ArcoDatos): Observable<Arco> {
    return this.http.post<Arco>(`${this.apiUrl}/${procesoId}/arcos`, datos);
  }

  editarArco(procesoId: number, arcoId: number, datos: ArcoDatos): Observable<Arco> {
    return this.http.put<Arco>(`${this.apiUrl}/${procesoId}/arcos/${arcoId}`, datos);
  }

  retirarArco(procesoId: number, arcoId: number, datos: RetiradaDatos): Observable<string[]> {
    return this.http.delete<string[]>(`${this.apiUrl}/${procesoId}/arcos/${arcoId}`, { body: datos });
  }
}
