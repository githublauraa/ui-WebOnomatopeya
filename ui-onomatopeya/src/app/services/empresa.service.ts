import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Empresa, RegistroEmpresa } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly url = `${environment.apiUrl}/empresas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.url);
  }

  registrar(datos: RegistroEmpresa): Observable<Empresa> {
    return this.http.post<Empresa>(this.url, datos);
  }
}
