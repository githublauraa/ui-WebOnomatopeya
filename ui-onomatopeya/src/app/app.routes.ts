import { Routes } from '@angular/router';
import { UsuarioListComponent } from './usuarios/usuario-list/usuario-list.component';
import { DiagramaComponent } from './procesos/diagrama/diagrama';

export const routes: Routes = [
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'usuarios', component: UsuarioListComponent },
  { path: 'procesos/:id/diagrama', component: DiagramaComponent }
];