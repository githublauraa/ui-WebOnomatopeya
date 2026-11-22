export interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  correoContacto: string;
}

/** Contrato público POST /empresas: crea empresa y administrador inicial. */
export interface RegistroEmpresa {
  empresa: { nombre: string; nit: string; correoContacto: string };
  administrador: { nombre: string; correo: string; contrasena: string };
}
