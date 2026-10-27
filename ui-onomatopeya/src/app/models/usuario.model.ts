export interface Usuario {
  id: number;
  empresaId: number;
  nombre: string;
  correo: string;
  rolAcceso: 'ADMINISTRADOR' | 'EDITOR' | 'LECTURA';
  estado: 'INVITADO' | 'ACTIVO' | 'INACTIVO';
  fechaCreacion: string;
  version: number;
}
