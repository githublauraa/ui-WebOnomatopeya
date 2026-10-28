import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const esApi = request.url.startsWith(`${environment.apiUrl}/`);
  const esLogin = request.url === `${environment.apiUrl}/auth/login`;
  const esRegistroPublico = request.method === 'POST' && request.url === `${environment.apiUrl}/empresas`;
  const esAceptarInvitacion = request.method === 'POST' && request.url === `${environment.apiUrl}/usuarios/invitaciones/aceptar`;
  const esPublica = esLogin || esRegistroPublico || esAceptarInvitacion;
  const token = esApi && !esPublica ? auth.token() : null;

  const peticion = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(peticion).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401 && esApi && !esPublica) {
        auth.cerrar();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
