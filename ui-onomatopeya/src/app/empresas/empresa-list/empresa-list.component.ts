import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Empresa } from '../../models/empresa.model';
import { mensajeDeError } from '../../models/error-response.model';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './empresa-list.component.html'
})
export class EmpresaListComponent implements OnInit {
  empresas: Empresa[] = [];
  cargando = false;
  error = '';

  constructor(private empresasService: EmpresaService, private cambios: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.empresasService.listar().subscribe({
      next: empresas => {
        this.empresas = empresas;
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
}
