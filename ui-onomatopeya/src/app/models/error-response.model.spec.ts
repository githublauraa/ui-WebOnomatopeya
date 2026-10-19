import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './error-response.model';

describe('mensajeDeError', () => {
  it('muestra los campos rechazados por la API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { detail: 'Revisa los campos indicados.', campos: { correo: 'debe ser válido' } }
    });

    expect(mensajeDeError(error)).toBe('correo: debe ser válido');
  });

  it('distingue una falla de conexión', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 0 })))
      .toBe('No se pudo conectar con el servidor.');
  });
});
