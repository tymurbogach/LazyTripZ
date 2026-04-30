import { Component, Input } from '@angular/core';

import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';

/**
 * Interfaz auxiliar para representar una localidad con su rango de fechas disponible.
 */
interface LocalidadConFechas {
  locality: string;
  start_date: string;
  end_date: string;
}

/**
 * Componente para el paso de actividades personalizadas del viaje.
 * Permite agregar, editar y eliminar actividades asociadas a las localidades seleccionadas.
 */
@Component({
  selector: 'app-activities-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './activities-step.component.html',
})
export class ActivitiesStepComponent {
  /**
   * Formulario padre que contiene el FormArray de actividades.
   */
  @Input() parentForm!: FormGroup;

  /**
   * Función para añadir una nueva actividad (pasada desde el componente padre).
   */
  @Input() onAddActivity!: () => void;

  /**
   * Función para eliminar una actividad (pasada desde el componente padre).
   */
  @Input() onRemoveActivity!: (index: number) => void;

  /**
   * Lista de localidades disponibles con sus respectivos rangos de fechas.
   */
  @Input() availableLocations: LocalidadConFechas[] = [];

  /**
   * Devuelve el FormArray que contiene todas las actividades del viaje.
   */
  get activitiesFormArray(): FormArray {
    return this.parentForm.get('activities') as FormArray;
  }

  /**
   * Devuelve una lista de localidades únicas, eliminando duplicados por nombre.
   * Esto se usa en el selector de localidades para evitar entradas repetidas.
   */
  get uniqueAvailableLocations(): LocalidadConFechas[] {
    const seen = new Set<string>();
    return this.availableLocations.filter(loc => {
      const trimmed = loc.locality.trim();
      if (seen.has(trimmed)) return false;
      seen.add(trimmed);
      return true;
    });
  }

  /**
   * Obtiene la fecha mínima permitida para una localidad específica.
   * Se usa para validar la fecha de inicio de una actividad.
   * @param locality Nombre de la localidad.
   * @returns Fecha mínima permitida o null si no se encuentra.
   */
  getMinDateForLocality(locality: string): string | null {
    const loc = this.availableLocations.find(l => l.locality.trim() === locality?.trim());
    return loc?.start_date || null;
  }

  /**
   * Obtiene la fecha máxima permitida para una localidad específica.
   * Se usa para validar la fecha de fin de una actividad.
   * @param locality Nombre de la localidad.
   * @returns Fecha máxima permitida o null si no se encuentra.
   */
  getMaxDateForLocality(locality: string): string | null {
    const loc = this.availableLocations.find(l => l.locality.trim() === locality?.trim());
    return loc?.end_date || null;
  }

  /**
   * Función de tracking para *ngFor que mejora el rendimiento al renderizar localidades.
   * @param index Índice del elemento.
   * @param item Objeto LocalidadConFechas.
   * @returns Nombre de la localidad.
   */
  trackByLocality(index: number, item: LocalidadConFechas): string {
    return item.locality.trim();
  }

  /**
   * Método para eliminar una actividad del formulario, si se ha proporcionado un handler.
   * @param index Índice de la actividad a eliminar.
   */
  handleRemove(index: number): void {
    if (this.onRemoveActivity) {
      this.onRemoveActivity(index);
    }
  }
}
