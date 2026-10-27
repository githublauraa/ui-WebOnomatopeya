import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { mensajeDeError } from '../../models/error-response.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  templateUrl: './usuario-list.component.html'
})
export class UsuarioListComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargando = false;
  error = '';

  constructor(private usuarioService: UsuarioService, private cambios: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.obtenerUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.cargando = false;
        this.cambios.markForCheck();
      }
    });
  }
}
