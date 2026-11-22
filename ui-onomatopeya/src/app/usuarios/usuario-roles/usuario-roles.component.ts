import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../models/error-response.model';
import { RolAcceso, Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-roles',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './usuario-roles.component.html'
})
export class UsuarioRolesComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly usuariosApi = inject(UsuarioService);
  private readonly cambios = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  cambiosPendientes: Record<number, RolAcceso> = {};
  guardandoId: number | null = null;
  confirmandoId: number | null = null;
  cargando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.usuariosApi.obtenerUsuarios().subscribe({
      next: resultado => {
        this.usuarios = resultado;
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

  seleccionar(usuario: Usuario, evento: Event): void {
    const value = (evento.target as HTMLSelectElement).value;
    if (value === 'ADMINISTRADOR' || value === 'EDITOR' || value === 'LECTURA') {
      this.cambiosPendientes[usuario.id] = value;
      this.confirmandoId = null;
    }
  }

  guardar(usuario: Usuario): void {
    if (!this.auth.esAdministrador() || this.guardandoId !== null ||
        this.confirmandoId !== usuario.id || usuario.estado !== 'ACTIVO') return;
    const nuevoRol = this.cambiosPendientes[usuario.id] ?? usuario.rolAcceso;
    if (nuevoRol === usuario.rolAcceso) return;
    this.guardandoId = usuario.id;
    this.error = '';
    this.mensaje = '';
    this.confirmandoId = null;
    this.usuariosApi.cambiarRol(usuario.id, { rolAcceso: nuevoRol, version: usuario.version }).subscribe({
      next: actualizado => {
        this.usuarios = this.usuarios.map(u => u.id === actualizado.id ? actualizado : u);
        delete this.cambiosPendientes[usuario.id];
        this.guardandoId = null;
        this.mensaje = `Rol de ${actualizado.nombre} actualizado.`;
        if (this.auth.usuario()?.id === actualizado.id) this.auth.usuario.set(actualizado);
        this.cambios.markForCheck();
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.guardandoId = null;
        this.cambios.markForCheck();
      }
    });
  }
}
