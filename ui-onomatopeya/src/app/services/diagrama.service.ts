import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Diagrama } from '../models/diagrama.model';

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
}