import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorResponse {
  detail?: string;
  campos?: Record<string, string>;
}

export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado.';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }

  const respuesta = error.error as ErrorResponse | null;
  if (respuesta && typeof respuesta === 'object') {
    if (respuesta.campos && typeof respuesta.campos === 'object') {
      const campos = Object.entries(respuesta.campos);
      if (campos.length > 0) {
        return campos.map(([nombre, detalle]) => `${nombre}: ${detalle}`).join('. ');
      }
    }
    if (typeof respuesta.detail === 'string' && respuesta.detail.trim()) {
      return respuesta.detail;
    }
  }

  switch (error.status) {
    case 401: return 'La sesión no es válida o ha vencido.';
    case 403: return 'No tienes permiso para esta operación.';
    case 404: return 'No se encontró el registro solicitado.';
    case 409: return 'Los datos entran en conflicto con otro registro.';
    default: return 'No fue posible completar la solicitud.';
  }
}
