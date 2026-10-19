import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../models/error-response.model';
import { Proceso } from '../../models/proceso.model';
import { AuthService } from '../../services/auth.service';
import { ProcesoService } from '../../services/proceso.service';

@Component({
  selector: 'app-proceso-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './procesos-list.component.html'
})
export class ProcesosListComponent implements OnInit {
  procesos: Proceso[] = [];
  pagina = 0;
  paginas = 0;
  total = 0;
  cargando = false;
  error = '';

  constructor(
    private procesosService: ProcesoService,
    private auth: AuthService,
    private router: Router,
    private cambios: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar(0);
  }

  cargar(pagina: number): void {
    if (pagina < 0 || (this.paginas > 0 && pagina >= this.paginas)) return;

    this.cargando = true;
    this.error = '';
    this.procesosService.listar(pagina).subscribe({
      next: respuesta => {
        this.procesos = respuesta.contenido;
        this.pagina = respuesta.pagina;
        this.paginas = respuesta.paginas;
        this.total = respuesta.total;
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: error => {
        this.error = mensajeDeError(error);
        this.cargando = false;
        this.cambios.markForCheck();
      }
    });
  }

  salir(): void {
    this.auth.cerrar();
    void this.router.navigateByUrl('/login');
  }
}
