import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Diagrama } from '../../models/diagrama.model';
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
    private diagramaService: DiagramaService
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
      },
      error: (error) => {
        console.error('Error al consultar el diagrama:', error);
        this.error = 'No fue posible cargar el diagrama.';
        this.cargando = false;
      }
    });
  }
}