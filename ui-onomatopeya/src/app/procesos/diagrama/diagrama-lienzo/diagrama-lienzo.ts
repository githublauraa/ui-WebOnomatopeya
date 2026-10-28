import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Arco, Lane, Nodo, Pool } from '../../../models/diagrama.model';

/** Cambio de posición confirmado al soltar la figura. */

/** ONOMA-CONEXIONES-VISUALES-V1: solicitud de conexion tras soltar sobre otro nodo. */
export interface ConexionLienzo {
  origenId: number;
  destinoId: number;
}

export interface MovimientoNodo {
  nodo: Nodo;
  posicionX: number;
  posicionY: number;
  laneId: number | null;
}

/** Representación visual pura: no construye ni ejecuta peticiones HTTP. */
@Component({
  selector: 'app-diagrama-lienzo',
  standalone: true,
  templateUrl: './diagrama-lienzo.html',
  styleUrl: './diagrama-lienzo.css',
})
export class DiagramaLienzoComponent {
  @Input() editable = false;
  /** Mantener visibles los puntos de conexión mientras se espera a la API. */
  @Input() bloqueado = false;
  /** Borrar la vista previa después de guardar o revertir una posición. */
  @Input() set movimientoFinalizado(value: { nodoId: number; secuencia: number } | null) {
    if (value) this.vistaPrevia.delete(value.nodoId);
  }
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
  @Output() moverNodo = new EventEmitter<MovimientoNodo>();
  @Output() errorMovimiento = new EventEmitter<string>();
  @Output() crearConexion = new EventEmitter<ConexionLienzo>();
  @Output() errorConexion = new EventEmitter<string>();

  seleccionadoId: number | null = null;
  seleccionadoArcoId: number | null = null;
  conexionPrevia: { origenId: number; x: number; y: number } | null = null;
  private conexion: { origenId: number; pointerId: number; elemento: HTMLElement } | null = null;

  get seleccionadoArco(): Arco | undefined {
    return this.seleccionadoArcoId === null ? undefined : this.arcos.find(a => a.id === this.seleccionadoArcoId);
  }

  seleccionarNodo(nodo: Nodo): void {
    this.seleccionadoId = nodo.id;
    this.seleccionadoArcoId = null;
  }

  seleccionarArco(arco: Arco, evento: MouseEvent): void {
    evento.stopPropagation();
    this.seleccionadoId = null;
    this.seleccionadoArcoId = arco.id;
  }

  abrirEditorNodo(nodo: Nodo, evento: MouseEvent): void {
    evento.stopPropagation();
    this.seleccionarNodo(nodo);
    if (this.editable) this.editarNodo.emit(nodo);
  }

  /** Presionar el punto de conexion sin iniciar el arrastre de la figura. */
  iniciarConexion(evento: PointerEvent, nodo: Nodo): void {
    evento.stopPropagation();
    if (!this.editable || this.bloqueado || evento.button !== 0 || this.conexion || this.arrastre) return;
    evento.preventDefault();
    const elemento = evento.currentTarget as HTMLElement;
    this.seleccionarNodo(nodo);
    this.conexion = { origenId: nodo.id, pointerId: evento.pointerId, elemento };
    this.conexionPrevia = { origenId: nodo.id, x: this.centroX(nodo.id), y: this.centroY(nodo.id) };
    elemento.setPointerCapture(evento.pointerId);
  }

  /** La flecha temporal sigue al mouse (tambien funciona con Pointer Events tactiles). */
  moverConexion(evento: PointerEvent): void {
    const c = this.conexion;
    if (!c || c.pointerId !== evento.pointerId) return;
    evento.stopPropagation();
    const lienzo = c.elemento.closest('.lienzo-pool') as HTMLElement | null;
    if (!lienzo) return;
    const rect = lienzo.getBoundingClientRect();
    const sx = rect.width ? (this.pool.ancho ?? rect.width) / rect.width : 1;
    const sy = rect.height ? (this.pool.alto ?? rect.height) / rect.height : 1;
    this.conexionPrevia = {
      origenId: c.origenId,
      x: Math.max(0, Math.min(this.pool.ancho ?? 0, Math.round((evento.clientX - rect.left) * sx))),
      y: Math.max(0, Math.min(this.pool.alto ?? 0, Math.round((evento.clientY - rect.top) * sy)))
    };
    evento.preventDefault();
  }

  terminarConexion(evento: PointerEvent): void {
    const c = this.conexion;
    if (!c || c.pointerId !== evento.pointerId) return;
    evento.stopPropagation();
    evento.preventDefault();
    // elementFromPoint detecta el nodo realmente situado bajo el puntero aun con pointer capture.
    const elementoDestino = document.elementFromPoint(evento.clientX, evento.clientY);
    const articulo = elementoDestino?.closest('[data-nodo-id]');
    const destinoId = Number(articulo?.getAttribute('data-nodo-id'));
    this.cancelarConexionInterna();
    if (Number.isInteger(destinoId) && destinoId > 0 && destinoId !== c.origenId &&
        this.nodos.some(n => n.id === destinoId)) {
      this.crearConexion.emit({ origenId: c.origenId, destinoId });
    } else {
      this.errorConexion.emit('Para conectar, arrastra el punto azul y sueltalo sobre otra figura del mismo pool.');
    }
  }

  cancelarConexion(evento: PointerEvent): void {
    if (!this.conexion || this.conexion.pointerId !== evento.pointerId) return;
    evento.stopPropagation();
    this.cancelarConexionInterna();
  }

  private cancelarConexionInterna(): void {
    const c = this.conexion;
    if (c && c.elemento.hasPointerCapture?.(c.pointerId)) c.elemento.releasePointerCapture(c.pointerId);
    this.conexion = null;
    this.conexionPrevia = null;
  }


  /** Vista previa temporal; la persistencia la realiza el componente contenedor. */
  private vistaPrevia = new Map<number, { x: number; y: number }>();
  arrastrandoNodoId: number | null = null;
  private arrastre: {
    nodo: Nodo;
    pointerId: number;
    pantallaX: number;
    pantallaY: number;
    origenX: number;
    origenY: number;
    elemento: HTMLElement;
    movio: boolean;
  } | null = null;

  posicionX(nodo: Nodo): number { return this.vistaPrevia.get(nodo.id)?.x ?? nodo.posicionX ?? 0; }
  posicionY(nodo: Nodo): number { return this.vistaPrevia.get(nodo.id)?.y ?? nodo.posicionY ?? 0; }

  iniciarArrastre(evento: PointerEvent, nodo: Nodo): void {
    this.seleccionadoId = nodo.id;
    if (!this.editable || this.bloqueado || evento.button !== 0 || this.arrastre) return;
    const elemento = evento.currentTarget as HTMLElement;
    this.arrastre = {
      nodo, pointerId: evento.pointerId, pantallaX: evento.clientX, pantallaY: evento.clientY,
      origenX: this.posicionX(nodo), origenY: this.posicionY(nodo), elemento, movio: false
    };
    this.arrastrandoNodoId = nodo.id;
    elemento.setPointerCapture(evento.pointerId);
    evento.preventDefault();
  }

  moverArrastre(evento: PointerEvent): void {
    const a = this.arrastre;
    if (!a || a.pointerId !== evento.pointerId) return;
    const dx = evento.clientX - a.pantallaX;
    const dy = evento.clientY - a.pantallaY;
    if (!a.movio && Math.hypot(dx, dy) < 4) return;
    a.movio = true;
    const rect = a.elemento.parentElement?.getBoundingClientRect();
    const escalaX = rect?.width ? (this.pool.ancho ?? rect.width) / rect.width : 1;
    const escalaY = rect?.height ? (this.pool.alto ?? rect.height) / rect.height : 1;
    const x = this.limitar(Math.round(a.origenX + dx * escalaX), 0, Math.max(0, (this.pool.ancho ?? 0) - (a.nodo.ancho ?? 0)));
    const y = this.limitar(Math.round(a.origenY + dy * escalaY), 0, Math.max(0, (this.pool.alto ?? 0) - (a.nodo.alto ?? 0)));
    this.vistaPrevia.set(a.nodo.id, { x, y });
    evento.preventDefault();
  }

  terminarArrastre(evento: PointerEvent): void {
    const a = this.arrastre;
    if (!a || a.pointerId !== evento.pointerId) return;
    this.arrastre = null;
    this.arrastrandoNodoId = null;
    if (a.elemento.hasPointerCapture?.(evento.pointerId)) {
      a.elemento.releasePointerCapture(evento.pointerId);
    }
    if (!a.movio) { this.vistaPrevia.delete(a.nodo.id); return; }
    const destino = this.vistaPrevia.get(a.nodo.id);
    if (!destino) return;
    let laneId = a.nodo.laneId;
    if (a.nodo.clase === 'ACTIVIDAD') {
      const lane = this.lanes.find(l => {
        const inicio = this.posicionLane(l);
        return destino.y >= inicio && destino.y + (a.nodo.alto ?? 0) <= inicio + (l.altura ?? 0);
      });
      if (!lane) {
        this.vistaPrevia.delete(a.nodo.id);
        this.errorMovimiento.emit('La actividad debe permanecer completamente dentro de una lane.');
        return;
      }
      laneId = lane.id;
    }
    if (destino.x === (a.nodo.posicionX ?? 0) && destino.y === (a.nodo.posicionY ?? 0) && laneId === a.nodo.laneId) {
      this.vistaPrevia.delete(a.nodo.id);
      return;
    }
    this.moverNodo.emit({ nodo: a.nodo, posicionX: destino.x, posicionY: destino.y, laneId });
  }

  cancelarArrastre(evento: PointerEvent): void {
    const a = this.arrastre;
    if (!a || a.pointerId !== evento.pointerId) return;
    this.vistaPrevia.delete(a.nodo.id);
    this.arrastre = null;
    this.arrastrandoNodoId = null;
  }

  private limitar(numero: number, menor: number, mayor: number): number {
    return Math.max(menor, Math.min(mayor, numero));
  }


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
    return n ? this.posicionX(n) + (n.ancho ?? 0) / 2 : 0;
  }
  centroY(id: number): number {
    const n = this.nodoPorId(id);
    return n ? this.posicionY(n) + (n.alto ?? 0) / 2 : 0;
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
