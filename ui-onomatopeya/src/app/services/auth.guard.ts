import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token()) return router.createUrlTree(['/login']);

  return auth.cargarUsuario().pipe(
    map(() => !route.data['editar'] || auth.puedeEditar()
      ? true : router.createUrlTree(['/procesos'])),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
