import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDog, faCat } from '@fortawesome/free-solid-svg-icons';

/**
 * Componente para el paso de datos generales del viaje.
 * Permite seleccionar medios de transporte y tipos de mascotas.
 */
@Component({
  selector: 'app-trip-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, FontAwesomeModule],
  templateUrl: './trip-step.component.html',
})
export class TripStepComponent implements OnInit {
  /**
   * Formulario padre que contiene los campos globales del viaje.
   */
  @Input() parentForm!: FormGroup;

  /**
   * Lista de opciones de transporte disponibles.
   */
  @Input() transportOptions: string[] = [];

  /**
   * Lista de tipos de mascotas disponibles.
   */
  @Input() petOptions: string[] = [];

  /**
   * Íconos FontAwesome para mostrar visualmente los tipos de mascotas.
   */
  faDog = faDog;
  faCat = faCat;

  /**
   * Hook de inicialización del componente.
   */
  ngOnInit(): void {}

  /**
   * Acceso al FormArray de transportes desde el formulario padre.
   */
  get transport(): FormArray {
    return this.parentForm.get('transport') as FormArray;
  }

  /**
   * Acceso al FormArray de mascotas desde el formulario padre.
   */
  get pets(): FormArray {
    return this.parentForm.get('pets') as FormArray;
  }

  /**
   * Alterna la selección de un tipo de transporte. 
   * Si ya está seleccionado, lo elimina; si no, lo añade al FormArray.
   * @param value Valor del transporte a alternar.
   */
  toggleTransport(value: string) {
    const arr = this.transport;
    const idx = arr.controls.findIndex(ctrl => this.normalize(ctrl.value) === this.normalize(value));
    if (idx === -1) {
      arr.push(new FormControl(this.normalize(value)));
    } else {
      arr.removeAt(idx);
    }
    arr.updateValueAndValidity();
  }

  /**
   * Verifica si un tipo de transporte está actualmente seleccionado.
   * @param value Valor del transporte a verificar.
   * @returns true si está seleccionado, false si no.
   */
  isTransportSelected(value: string): boolean {
    return this.transport.value
      .map((v: string) => this.normalize(v))
      .includes(this.normalize(value));
  }

  /**
   * Alterna la selección de una mascota. 
   * Agrega o elimina del FormArray de mascotas.
   * @param value Tipo de mascota a alternar.
   */
  togglePet(value: string) {
    const arr = this.pets;
    const idx = arr.controls.findIndex(ctrl => this.normalize(ctrl.value) === this.normalize(value));
    if (idx === -1) {
      arr.push(new FormControl(this.normalize(value)));
    } else {
      arr.removeAt(idx);
    }
    arr.updateValueAndValidity();
  }

  /**
   * Verifica si una mascota está seleccionada actualmente.
   * @param value Tipo de mascota a verificar.
   * @returns true si está seleccionada, false si no.
   */
  isPetSelected(value: string): boolean {
    return this.pets.value
      .map((v: string) => this.normalize(v))
      .includes(this.normalize(value));
  }

  /**
   * Devuelve el nombre del ícono de Material para representar el medio de transporte.
   * @param option Opción de transporte.
   * @returns Nombre del ícono de Material.
   */
  getTransportIcon(option: string): string {
    switch (option) {
      case 'car': return 'directions_car';
      case 'bus': return 'directions_bus';
      case 'train': return 'train';
      case 'plane': return 'flight';
      default: return 'commute';
    }
  }

  /**
   * Normaliza el valor (en minúsculas y sin espacios) para comparaciones consistentes.
   * @param value Valor a normalizar.
   * @returns Valor normalizado.
   */
  private normalize(value: string): string {
    return value?.toLowerCase().trim();
  }
}
