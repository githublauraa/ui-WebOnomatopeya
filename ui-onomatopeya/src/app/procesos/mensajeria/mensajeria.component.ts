import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  CampoMensaje,
  Diagrama,
  FlujoMensaje,
  FlujoMensajeDatos,
  Mensaje,
  MensajeDatos,
  MensajeDetalle,
  Nodo,
  UsoMensajeActividad
} from '../../models/diagrama.model';
import { mensajeDeError } from '../../models/error-response.model';
import { MensajeriaService } from '../../services/mensajeria.service';

@Component({
  selector: 'app-mensajeria',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './mensajeria.component.html',
  styleUrl: './mensajeria.component.css'
})
export class MensajeriaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(MensajeriaService);

  @Input({ required: true }) diagrama!: Diagrama;
  @Input() editable = false;
  @Input() retirable = false;
  @Output() actualizado = new EventEmitter<void>();

  mensajeEditando: Mensaje | null = null;
  mensajeActivo: MensajeDetalle | null = null;
  campoEditando: CampoMensaje | null = null;
  flujoEditando: FlujoMensaje | null = null;
  guardando = false;
  error = '';
  aviso = '';

  readonly formularioMensaje = this.fb.nonNullable.group({
    nodoId: [0, [Validators.required, Validators.min(1)]],
    sentido: this.fb.nonNullable.control<Mensaje['sentido']>('ENVIO'),
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    origenExterno: false,
    correlacionTipo: this.fb.control<Mensaje['correlacionTipo']>(null),
    correlacionNegocio: this.fb.control<string | null>(null),
    correlacionCampoId: this.fb.control<number | null>(null),
    politicaSinCorrespondencia: this.fb.control<Mensaje['politicaSinCorrespondencia']>(null)
  });

  readonly formularioCampo = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    tipoDato: this.fb.nonNullable.control<CampoMensaje['tipoDato']>('TEXTO'),
    orden: [1, [Validators.required, Validators.min(0)]]
  });

  readonly formularioUso = this.fb.nonNullable.group({
    actividadId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly formularioFlujo = this.fb.group({
    poolOrigenId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    poolDestinoId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    nodoOrigenId: this.fb.control<number | null>(null),
    nodoDestinoId: this.fb.control<number | null>(null),
    tipoDestino: this.fb.control<FlujoMensaje['tipoDestino']>(null),
    politicaFallo: this.fb.control<FlujoMensaje['politicaFallo']>(null),
    actividadErrorId: this.fb.control<number | null>(null)
  });

  get nodosMensaje(): Nodo[] {
    return this.diagrama.nodos.filter(nodo =>
      nodo.estado !== 'RETIRADO' &&
      (nodo.tipoActividad === 'ENVIO' || nodo.naturalezaEvento === 'MENSAJE')
    );
  }

  get actividades(): Nodo[] {
    return this.diagrama.nodos.filter(nodo => nodo.clase === 'ACTIVIDAD' && nodo.estado !== 'RETIRADO');
  }

  get actividadesUso(): Nodo[] {
    if (this.mensajeActivo?.mensaje.sentido !== 'RECEPCION') return [];
    const nodoMensaje = this.diagrama.nodos.find(nodo => nodo.id === this.mensajeActivo?.mensaje.nodoId);
    return this.actividades.filter(actividad => actividad.poolId === nodoMensaje?.poolId);
  }

  get actividadesError(): Nodo[] {
    const poolId = this.formularioFlujo.controls.poolOrigenId.value;
    return this.actividades.filter(actividad => actividad.poolId === poolId);
  }

  get nodosOrigenFlujo(): Nodo[] {
    return this.nodosFlujo(this.formularioFlujo.controls.poolOrigenId.value, 'ENVIO');
  }

  get nodosDestinoFlujo(): Nodo[] {
    return this.nodosFlujo(this.formularioFlujo.controls.poolDestinoId.value, 'RECEPCION');
  }

  seleccionarMensaje(detalle: MensajeDetalle): void {
    this.mensajeActivo = detalle;
    this.campoEditando = null;
    this.formularioCampo.reset({ nombre: '', tipoDato: 'TEXTO', orden: detalle.campos.length + 1 });
    this.formularioUso.reset({ actividadId: 0 });
  }

  nuevoMensaje(): void {
    this.mensajeEditando = null;
    this.formularioMensaje.controls.nodoId.enable();
    this.formularioMensaje.controls.sentido.enable();
    this.limpiarEstado();
    this.formularioMensaje.reset({
      nodoId: this.nodosMensaje[0]?.id ?? 0,
      sentido: 'ENVIO',
      nombre: '',
      origenExterno: false,
      correlacionTipo: null,
      correlacionNegocio: null,
      correlacionCampoId: null,
      politicaSinCorrespondencia: null
    });
  }

  editarMensaje(detalle: MensajeDetalle): void {
    this.mensajeEditando = detalle.mensaje;
    this.mensajeActivo = detalle;
    this.limpiarEstado();
    this.formularioMensaje.reset({
      nodoId: detalle.mensaje.nodoId,
      sentido: detalle.mensaje.sentido,
      nombre: detalle.mensaje.nombre,
      origenExterno: detalle.mensaje.origenExterno,
      correlacionTipo: detalle.mensaje.correlacionTipo,
      correlacionNegocio: detalle.mensaje.correlacionNegocio,
      correlacionCampoId: detalle.mensaje.correlacionCampoId,
      politicaSinCorrespondencia: detalle.mensaje.politicaSinCorrespondencia
    });
    this.formularioMensaje.controls.nodoId.disable();
    this.formularioMensaje.controls.sentido.disable();
  }

  guardarMensaje(): void {
    if (!this.editable || this.formularioMensaje.invalid || this.guardando) {
      this.formularioMensaje.markAllAsTouched();
      return;
    }
    const valores = this.formularioMensaje.getRawValue();
    const datos: MensajeDatos = {
      ...valores,
      nombre: valores.nombre.trim(),
      correlacionNegocio: valores.correlacionTipo === 'NEGOCIO'
        ? valores.correlacionNegocio?.trim() || null : null,
      correlacionCampoId: valores.correlacionTipo === 'CAMPO' ? valores.correlacionCampoId : null,
      version: this.mensajeEditando?.version
    };
    this.ejecutar(
      this.mensajeEditando
        ? this.servicio.actualizarMensaje(this.diagrama.proceso.id, this.mensajeEditando.id, datos)
        : this.servicio.crearMensaje(this.diagrama.proceso.id, datos),
      this.mensajeEditando ? 'Mensaje actualizado.' : 'Mensaje creado.'
    );
  }

  retirarMensaje(detalle: MensajeDetalle): void {
    if (!this.retirable || !confirm(`¿Retirar el mensaje ${detalle.mensaje.nombre}?`)) return;
    this.ejecutar(
      this.servicio.retirarMensaje(this.diagrama.proceso.id, detalle.mensaje.id, detalle.mensaje.version),
      'Mensaje retirado.'
    );
  }

  editarCampo(campo: CampoMensaje): void {
    this.campoEditando = campo;
    this.formularioCampo.reset({ nombre: campo.nombre, tipoDato: campo.tipoDato, orden: campo.orden });
  }

  guardarCampo(): void {
    if (!this.editable || !this.mensajeActivo || this.formularioCampo.invalid || this.guardando) {
      this.formularioCampo.markAllAsTouched();
      return;
    }
    const valores = this.formularioCampo.getRawValue();
    const datos = { ...valores, nombre: valores.nombre.trim(), version: this.campoEditando?.version };
    const mensajeId = this.mensajeActivo.mensaje.id;
    this.ejecutar(
      this.campoEditando
        ? this.servicio.actualizarCampo(this.diagrama.proceso.id, mensajeId, this.campoEditando.id, datos)
        : this.servicio.crearCampo(this.diagrama.proceso.id, mensajeId, datos),
      this.campoEditando ? 'Campo actualizado.' : 'Campo creado.'
    );
  }

  retirarCampo(campo: CampoMensaje): void {
    if (!this.retirable || !this.mensajeActivo || !confirm(`¿Retirar el campo ${campo.nombre}?`)) return;
    this.ejecutar(this.servicio.retirarCampo(
      this.diagrama.proceso.id, this.mensajeActivo.mensaje.id, campo.id, campo.version
    ), 'Campo retirado.');
  }

  guardarUso(): void {
    if (!this.editable || !this.mensajeActivo || this.mensajeActivo.mensaje.sentido !== 'RECEPCION'
      || this.formularioUso.invalid || this.guardando) return;
    this.ejecutar(this.servicio.crearUso(
      this.diagrama.proceso.id,
      this.mensajeActivo.mensaje.id,
      this.formularioUso.getRawValue()
    ), 'Uso asociado.');
  }

  retirarUso(uso: UsoMensajeActividad): void {
    if (!this.retirable || !this.mensajeActivo) return;
    this.ejecutar(this.servicio.retirarUso(
      this.diagrama.proceso.id, this.mensajeActivo.mensaje.id, uso.id, uso.version
    ), 'Uso retirado.');
  }

  nuevoFlujo(): void {
    this.flujoEditando = null;
    this.limpiarEstado();
    this.formularioFlujo.reset({
      poolOrigenId: this.diagrama.pools[0]?.id ?? 0,
      poolDestinoId: this.diagrama.pools[1]?.id ?? 0,
      nodoOrigenId: null, nodoDestinoId: null, tipoDestino: null,
      politicaFallo: null, actividadErrorId: null
    });
  }

  editarFlujo(flujo: FlujoMensaje): void {
    this.flujoEditando = flujo;
    this.limpiarEstado();
    this.formularioFlujo.reset({
      poolOrigenId: flujo.poolOrigenId,
      poolDestinoId: flujo.poolDestinoId ?? 0,
      nodoOrigenId: flujo.nodoOrigenId,
      nodoDestinoId: flujo.nodoDestinoId,
      tipoDestino: flujo.tipoDestino,
      politicaFallo: flujo.politicaFallo,
      actividadErrorId: flujo.actividadErrorId
    });
  }

  guardarFlujo(): void {
    if (!this.editable || this.formularioFlujo.invalid || this.guardando) {
      this.formularioFlujo.markAllAsTouched();
      return;
    }
    if (this.formularioFlujo.controls.poolOrigenId.value === this.formularioFlujo.controls.poolDestinoId.value) {
      this.error = 'El pool de origen y el pool de destino deben ser diferentes.';
      return;
    }
    const datos: FlujoMensajeDatos = {
      ...this.formularioFlujo.getRawValue(),
      version: this.flujoEditando?.version
    };
    this.ejecutar(
      this.flujoEditando
        ? this.servicio.actualizarFlujo(this.diagrama.proceso.id, this.flujoEditando.id, datos)
        : this.servicio.crearFlujo(this.diagrama.proceso.id, datos),
      this.flujoEditando ? 'Flujo actualizado.' : 'Flujo creado.'
    );
  }

  retirarFlujo(flujo: FlujoMensaje): void {
    if (!this.retirable || !confirm('¿Retirar este flujo de mensaje?')) return;
    this.ejecutar(this.servicio.retirarFlujo(
      this.diagrama.proceso.id, flujo.id, flujo.version
    ), 'Flujo retirado.');
  }

  nombreNodo(id: number | null): string {
    return this.diagrama.nodos.find(nodo => nodo.id === id)?.nombre ?? 'Sin nodo';
  }

  nombrePool(id: number | null): string {
    return this.diagrama.pools.find(pool => pool.id === id)?.nombre ?? 'Sin pool';
  }

  private ejecutar(operacion: Observable<unknown>, mensaje: string): void {
    this.guardando = true;
    this.error = '';
    this.aviso = '';
    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.aviso = mensaje;
        this.actualizado.emit();
      },
      error: (error: unknown) => {
        this.guardando = false;
        this.error = mensajeDeError(error);
      }
    });
  }

  private limpiarEstado(): void {
    this.error = '';
    this.aviso = '';
  }

  private nodosFlujo(poolId: number, sentido: Mensaje['sentido']): Nodo[] {
    const ids = new Set(this.diagrama.mensajes
      .filter(detalle => detalle.mensaje.sentido === sentido)
      .map(detalle => detalle.mensaje.nodoId));
    return this.diagrama.nodos.filter(nodo => nodo.poolId === poolId && ids.has(nodo.id));
  }
}
