export interface Credenciales {
  correo: string;
  contrasena: string;
}

export interface Sesion {
  token: string;
  tipo: string;
  expiraEn: string;
}
