import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DatosDesactivacion,
  DatosInvitacion,
  InvitacionUsuario,
  Usuario
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  invitar(datos: DatosInvitacion): Observable<InvitacionUsuario> {
    return this.http.post<InvitacionUsuario>(`${this.apiUrl}/invitaciones`, datos);
  }

  desactivar(id: number, datos: DatosDesactivacion): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/desactivar`, datos);
  }
}
