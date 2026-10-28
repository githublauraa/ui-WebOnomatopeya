import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { mensajeDeError } from '../../models/error-response.model';
import { CambioProceso, FiltrosProcesos, Proceso } from '../../models/proceso.model';
import { AuthService } from '../../services/auth.service';
import { ProcesoService } from '../../services/proceso.service';

@Component({
  selector: 'app-proceso-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './procesos-list.component.html',
})
export class ProcesosListComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private consulta?: Subscription;
  private consultaHistorial?: Subscription;
  private navegacion?: Subscription;
  private retirada?: Subscription;

  readonly filtros = this.fb.nonNullable.group({
    nombre: '',
    categoria: '',
    estado: this.fb.nonNullable.control<FiltrosProcesos['estado']>(''),
    activo: true,
  });
  procesos: Proceso[] = [];
  pagina = 0;
  paginas = 0;
  total = 0;
  cargando = false;
  error = '';
  mensaje = '';
  confirmando: Proceso | null = null;
  retirando = false;
  procesoHistorial: Proceso | null = null;
  historial: CambioProceso[] = [];
  cargandoHistorial = false;
  errorHistorial = '';

  constructor(
    private procesosService: ProcesoService,
    public auth: AuthService,
    private router: Router,
    private cambios: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.navegacion = this.ruta.queryParamMap.subscribe((params) => {
      const estado = params.get('estado');
      this.filtros.reset({
        nombre: params.get('nombre') ?? '',
        categoria: params.get('categoria') ?? '',
        estado: estado === 'BORRADOR' || estado === 'PUBLICADO' ? estado : '',
        activo: params.get('activo') !== 'false',
      });
      const pagina = Number(params.get('pagina') ?? 0);
      this.cargar(Number.isInteger(pagina) && pagina >= 0 ? pagina : 0);
    });
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
    this.consultaHistorial?.unsubscribe();
    this.navegacion?.unsubscribe();
    this.retirada?.unsubscribe();
  }

  buscar(pagina = 0): void {
    const valores = this.filtros.getRawValue();
    const queryParams = {
      ...valores,
      nombre: valores.nombre.trim(),
      categoria: valores.categoria.trim(),
      pagina,
    };
    void this.router.navigate([], { relativeTo: this.ruta, queryParams });
  }

  limpiar(): void {
    this.filtros.reset({ nombre: '', categoria: '', estado: '', activo: true });
    this.buscar();
  }

  cargar(pagina: number): void {
    this.consulta?.unsubscribe();
    this.cerrarHistorial();
    this.confirmando = null;
    this.cargando = true;
    this.error = '';
    this.consulta = this.procesosService.listar(pagina, this.filtros.getRawValue()).subscribe({
      next: (respuesta) => {
        this.procesos = respuesta.contenido;
        this.pagina = respuesta.pagina;
        this.paginas = respuesta.paginas;
        this.total = respuesta.total;
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: (error) => {
        this.error = mensajeDeError(error);
        this.procesos = [];
        this.cargando = false;
        this.cambios.markForCheck();
      },
    });
  }

  verHistorial(proceso: Proceso): void {
    this.consultaHistorial?.unsubscribe();
    this.procesoHistorial = proceso;
    this.historial = [];
    this.errorHistorial = '';
    this.cargandoHistorial = true;
    this.consultaHistorial = this.procesosService.historial(proceso.id).subscribe({
      next: (historial) => {
        this.historial = historial;
        this.cargandoHistorial = false;
        this.cambios.markForCheck();
      },
      error: (error) => {
        this.errorHistorial = mensajeDeError(error);
        this.cargandoHistorial = false;
        this.cambios.markForCheck();
      },
    });
  }

  cerrarHistorial(): void {
    this.consultaHistorial?.unsubscribe();
    this.procesoHistorial = null;
    this.historial = [];
  }

  retirar(): void {
    const proceso = this.confirmando;
    if (!proceso || this.retirando || !this.auth.esAdministrador(proceso)) return;
    this.retirando = true;
    this.error = '';
    this.mensaje = '';
    this.retirada = this.procesosService.retirar(proceso).subscribe({
      next: () => {
        this.retirando = false;
        this.confirmando = null;
        this.mensaje = `${proceso.nombre} quedó inactivo. Sus datos e historial se conservan.`;
        if (this.procesos.length === 1 && this.pagina > 0) this.buscar(this.pagina - 1);
        else this.cargar(this.pagina);
        this.cambios.markForCheck();
      },
      error: (error) => {
        this.error = mensajeDeError(error);
        this.retirando = false;
        this.confirmando = null;
        this.cambios.markForCheck();
      },
    });
  }

  salir(): void {
    this.auth.cerrar();
    void this.router.navigateByUrl('/login');
  }
}
