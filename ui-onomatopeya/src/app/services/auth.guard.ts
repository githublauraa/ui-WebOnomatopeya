import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { RolAcceso } from '../models/usuario.model';
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

export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token()) return router.createUrlTree(['/login']);

  const roles = (route.data['roles'] ?? []) as RolAcceso[];
  const usuarioActual = auth.usuario();
  if (usuarioActual) {
    return roles.length === 0 || roles.includes(usuarioActual.rolAcceso)
      ? true : router.createUrlTree(['/procesos']);
  }

  return auth.cargarUsuario().pipe(
    map(usuario => roles.length === 0 || roles.includes(usuario.rolAcceso)
      ? true : router.createUrlTree(['/procesos'])),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
