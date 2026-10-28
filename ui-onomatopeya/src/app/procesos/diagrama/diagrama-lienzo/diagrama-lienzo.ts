import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Arco, Lane, Nodo, Pool } from '../../../models/diagrama.model';

/** Representación visual pura: no construye ni ejecuta peticiones HTTP. */
@Component({
  selector: 'app-diagrama-lienzo',
  standalone: true,
  templateUrl: './diagrama-lienzo.html',
  styleUrl: './diagrama-lienzo.css',
})
export class DiagramaLienzoComponent {
  @Input() editable = false;
  @Input() retirable = false;
  @Input({ required: true }) pool!: Pool;
  @Input({ required: true }) lanes: Lane[] = [];
  @Input({ required: true }) nodos: Nodo[] = [];
  @Input({ required: true }) arcos: Arco[] = [];
  @Output() editarLane = new EventEmitter<Lane>();
  @Output() retirarLane = new EventEmitter<Lane>();
  @Output() editarNodo = new EventEmitter<Nodo>();
  @Output() retirarNodo = new EventEmitter<Nodo>();
  @Output() editarArco = new EventEmitter<Arco>();
  @Output() retirarArco = new EventEmitter<Arco>();

  seleccionadoId: number | null = null;

  get seleccionado(): Nodo | undefined {
    return this.nodos.find((nodo) => nodo.id === this.seleccionadoId);
  }

  tamanoTexto(nodo: Nodo): number {
    const margen = nodo.clase === 'GATEWAY' ? 0.5 : nodo.clase === 'EVENTO' ? 0.66 : 0.88;
    const ancho = Math.max(1, (nodo.ancho ?? 0) * margen);
    const alto = Math.max(1, (nodo.alto ?? 0) * margen);
    const palabras = nodo.nombre.trim().split(/\s+/);
    for (let tamano = 14; tamano >= 6; tamano -= 0.5) {
      const capacidad = Math.max(1, Math.floor(ancho / (tamano * 0.65)));
      let lineas = 1;
      let ocupados = 0;
      for (const palabra of palabras) {
        if (ocupados > 0 && ocupados + 1 + palabra.length > capacidad) {
          lineas++;
          ocupados = 0;
        }
        const longitud = palabra.length + (ocupados > 0 ? 1 : 0);
        lineas += Math.floor((longitud - 1) / capacidad);
        ocupados += ((longitud - 1) % capacidad) + 1;
      }
      if (lineas * tamano * 1.15 <= alto) return tamano;
    }
    return 6;
  }

  altoLienzo(): number {
    return this.pool.alto ?? 0;
  }
  anchoLienzo(): number {
    return this.pool.ancho ?? 0;
  }
  posicionLane(lane: Lane): number {
    return this.lanes.filter((l) => l.orden < lane.orden).reduce((t, l) => t + (l.altura ?? 0), 0);
  }
  nodoPorId(id: number): Nodo | undefined {
    return this.nodos.find((n) => n.id === id);
  }
  centroX(id: number): number {
    const n = this.nodoPorId(id);
    return n ? (n.posicionX ?? 0) + (n.ancho ?? 0) / 2 : 0;
  }
  centroY(id: number): number {
    const n = this.nodoPorId(id);
    return n ? (n.posicionY ?? 0) + (n.alto ?? 0) / 2 : 0;
  }
  puntoMedioX(a: Arco): number {
    return (this.centroX(a.origenId) + this.centroX(a.destinoId)) / 2;
  }
  puntoMedioY(a: Arco): number {
    return (this.centroY(a.origenId) + this.centroY(a.destinoId)) / 2;
  }
  nombreNodo(id: number): string {
    return this.nodoPorId(id)?.nombre ?? `Nodo ${id}`;
  }
}
