import { Routes } from '@angular/router';
import { UsuarioListComponent } from './usuarios/usuario-list/usuario-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'usuarios', component: UsuarioListComponent }
];