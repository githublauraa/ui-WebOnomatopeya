import { Routes } from '@angular/router';
import { UsuarioListComponent } from './usuarios/usuario-list/usuario-list.component';
import { DiagramaComponent } from './procesos/diagrama/diagrama';
import { LoginComponent } from './login/login';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'usuarios', component: UsuarioListComponent, canActivate: [authGuard] },
  { path: 'procesos/:id/diagrama', component: DiagramaComponent, canActivate: [authGuard] }
];
