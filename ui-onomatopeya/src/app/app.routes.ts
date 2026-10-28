import { Routes } from '@angular/router';
import { UsuarioListComponent } from './usuarios/usuario-list/usuario-list.component';
import { DiagramaComponent } from './procesos/diagrama/diagrama';
import { ProcesosListComponent } from './procesos/proceso-list/procesos-list.component';
import { ProcesoFormComponent } from './procesos/proceso-form/proceso-form.component';
import { LoginComponent } from './login/login';
import { authGuard } from './services/auth.guard';
import { EmpresaListComponent } from './empresas/empresa-list/empresa-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'procesos', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'usuarios', component: UsuarioListComponent, canActivate: [authGuard] },
  { path: 'empresas', component: EmpresaListComponent, canActivate: [authGuard] },
  { path: 'procesos', component: ProcesosListComponent, canActivate: [authGuard] },
  { path: 'procesos/nuevo', component: ProcesoFormComponent, canActivate: [authGuard], data: { editar: true } },
  { path: 'procesos/:id/editar', component: ProcesoFormComponent, canActivate: [authGuard], data: { editar: true } },
  { path: 'procesos/:id/diagrama', component: DiagramaComponent, canActivate: [authGuard] }
];
