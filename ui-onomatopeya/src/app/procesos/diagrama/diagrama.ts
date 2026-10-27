import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Diagrama } from '../../models/diagrama.model';
import { mensajeDeError } from '../../models/error-response.model';
import { DiagramaService } from '../../services/diagrama.service';

@Component({
  selector: 'app-diagrama',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagrama.html',
  styleUrl: './diagrama.css'
})
export class DiagramaComponent implements OnInit {

  diagrama?: Diagrama;
  cargando = true;
  error = '';

  constructor(
    private ruta: ActivatedRoute,
    private diagramaService: DiagramaService,
    private cambios: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idProceso = Number(this.ruta.snapshot.paramMap.get('id'));

    if (!idProceso) {
      this.error = 'No se recibió un identificador de proceso válido.';
      this.cargando = false;
      return;
    }

    this.cargarDiagrama(idProceso);
  }

  cargarDiagrama(idProceso: number): void {
    this.diagramaService.obtenerDiagrama(idProceso).subscribe({
      next: (respuesta) => {
        this.diagrama = respuesta;
        this.cargando = false;
        this.cambios.markForCheck();
      },
      error: (error) => {
        this.error = mensajeDeError(error);
        this.cargando = false;
        this.cambios.markForCheck();
      }
    });
  }
}
