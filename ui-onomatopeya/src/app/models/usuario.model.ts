export type RolAcceso = 'ADMINISTRADOR' | 'EDITOR' | 'LECTURA';
export type EstadoUsuario = 'INVITADO' | 'ACTIVO' | 'INACTIVO';

export interface Usuario {
  id: number;
  empresaId: number;
  nombre: string;
  correo: string;
  rolAcceso: RolAcceso;
  estado: EstadoUsuario;
  fechaCreacion: string;
  version: number;
}

export type DatosInvitacion = Pick<Usuario, 'nombre' | 'correo' | 'rolAcceso'>;

export interface InvitacionUsuario {
  usuario: Usuario;
  tokenInvitacion: string;
  expiraEn: string;
}

export type DatosDesactivacion = Pick<Usuario, 'version'> & { confirmar: true };
