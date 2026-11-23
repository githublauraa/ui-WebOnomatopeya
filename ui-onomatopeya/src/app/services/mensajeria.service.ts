import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CampoMensaje,
  CampoMensajeDatos,
  FlujoMensaje,
  FlujoMensajeDatos,
  Mensaje,
  MensajeDatos,
  UsoMensajeActividad,
  UsoMensajeDatos
} from '../models/diagrama.model';

@Injectable({ providedIn: 'root' })
export class MensajeriaService {
  constructor(private http: HttpClient) {}

  listarMensajes(procesoId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(this.mensajesUrl(procesoId));
  }

  crearMensaje(procesoId: number, datos: MensajeDatos): Observable<Mensaje> {
    return this.http.post<Mensaje>(this.mensajesUrl(procesoId), datos);
  }

  actualizarMensaje(procesoId: number, mensajeId: number, datos: MensajeDatos): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.mensajesUrl(procesoId)}/${mensajeId}`, datos);
  }

  retirarMensaje(procesoId: number, mensajeId: number, version: number): Observable<void> {
    return this.http.delete<void>(`${this.mensajesUrl(procesoId)}/${mensajeId}`, {
      params: this.retirada(version)
    });
  }

  advertencias(procesoId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.mensajesUrl(procesoId)}/advertencias`);
  }

  listarCampos(procesoId: number, mensajeId: number): Observable<CampoMensaje[]> {
    return this.http.get<CampoMensaje[]>(this.camposUrl(procesoId, mensajeId));
  }

  crearCampo(procesoId: number, mensajeId: number, datos: CampoMensajeDatos): Observable<CampoMensaje> {
    return this.http.post<CampoMensaje>(this.camposUrl(procesoId, mensajeId), datos);
  }

  actualizarCampo(
    procesoId: number,
    mensajeId: number,
    campoId: number,
    datos: CampoMensajeDatos
  ): Observable<CampoMensaje> {
    return this.http.put<CampoMensaje>(`${this.camposUrl(procesoId, mensajeId)}/${campoId}`, datos);
  }

  retirarCampo(procesoId: number, mensajeId: number, campoId: number, version: number): Observable<void> {
    return this.http.delete<void>(`${this.camposUrl(procesoId, mensajeId)}/${campoId}`, {
      params: this.retirada(version)
    });
  }

  listarUsos(procesoId: number, mensajeId: number): Observable<UsoMensajeActividad[]> {
    return this.http.get<UsoMensajeActividad[]>(this.usosUrl(procesoId, mensajeId));
  }

  crearUso(procesoId: number, mensajeId: number, datos: UsoMensajeDatos): Observable<UsoMensajeActividad> {
    return this.http.post<UsoMensajeActividad>(this.usosUrl(procesoId, mensajeId), datos);
  }

  retirarUso(procesoId: number, mensajeId: number, usoId: number, version: number): Observable<void> {
    return this.http.delete<void>(`${this.usosUrl(procesoId, mensajeId)}/${usoId}`, {
      params: this.retirada(version)
    });
  }

  listarFlujos(procesoId: number): Observable<FlujoMensaje[]> {
    return this.http.get<FlujoMensaje[]>(this.flujosUrl(procesoId));
  }

  crearFlujo(procesoId: number, datos: FlujoMensajeDatos): Observable<FlujoMensaje> {
    return this.http.post<FlujoMensaje>(this.flujosUrl(procesoId), datos);
  }

  actualizarFlujo(procesoId: number, flujoId: number, datos: FlujoMensajeDatos): Observable<FlujoMensaje> {
    return this.http.put<FlujoMensaje>(`${this.flujosUrl(procesoId)}/${flujoId}`, datos);
  }

  retirarFlujo(procesoId: number, flujoId: number, version: number): Observable<void> {
    return this.http.delete<void>(`${this.flujosUrl(procesoId)}/${flujoId}`, {
      params: this.retirada(version)
    });
  }

  private mensajesUrl(procesoId: number): string {
    return `${environment.apiUrl}/procesos/${procesoId}/mensajes`;
  }

  private camposUrl(procesoId: number, mensajeId: number): string {
    return `${this.mensajesUrl(procesoId)}/${mensajeId}/campos`;
  }

  private usosUrl(procesoId: number, mensajeId: number): string {
    return `${this.mensajesUrl(procesoId)}/${mensajeId}/usos`;
  }

  private flujosUrl(procesoId: number): string {
    return `${environment.apiUrl}/procesos/${procesoId}/flujos-mensaje`;
  }

  private retirada(version: number): HttpParams {
    return new HttpParams().set('version', version).set('confirmar', true);
  }
}
