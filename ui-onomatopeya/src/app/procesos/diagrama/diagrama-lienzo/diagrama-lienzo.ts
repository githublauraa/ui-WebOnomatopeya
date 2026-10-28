import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Arco, Lane, Nodo, Pool } from '../../../models/diagrama.model';

/** Representación visual pura: no construye ni ejecuta peticiones HTTP. */
@Component({ selector: 'app-diagrama-lienzo', standalone: true, templateUrl: './diagrama-lienzo.html', styleUrl: './diagrama-lienzo.css' })
export class DiagramaLienzoComponent {
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

  altoLienzo(): number { return Math.max(this.pool.alto ?? 0, this.lanes.reduce((t, l) => t + (l.altura ?? 0), 0), 220); }
  anchoLienzo(): number { return Math.max(this.pool.ancho ?? 0, 620); }
  posicionLane(lane: Lane): number { return this.lanes.filter((l) => l.orden < lane.orden).reduce((t, l) => t + (l.altura ?? 0), 0); }
  nodoPorId(id: number): Nodo | undefined { return this.nodos.find((n) => n.id === id); }
  centroX(id: number): number { const n = this.nodoPorId(id); return n ? (n.posicionX ?? 0) + (n.ancho ?? 0) / 2 : 0; }
  centroY(id: number): number { const n = this.nodoPorId(id); return n ? (n.posicionY ?? 0) + (n.alto ?? 0) / 2 : 0; }
  puntoMedioX(a: Arco): number { return (this.centroX(a.origenId) + this.centroX(a.destinoId)) / 2; }
  puntoMedioY(a: Arco): number { return (this.centroY(a.origenId) + this.centroY(a.destinoId)) / 2; }
  nombreNodo(id: number): string { return this.nodoPorId(id)?.nombre ?? `Nodo ${id}`; }
}
