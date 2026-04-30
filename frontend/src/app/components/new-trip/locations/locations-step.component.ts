import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SearchGooglePlacesComponent } from '../../utilities/search-google-places/search-google-places.component';

/**
 * Componente para el paso de gestión de localizaciones del viaje.
 * Permite agregar, editar y eliminar destinos usando formularios reactivos.
 */
@Component({
  selector: 'app-locations-step',
  standalone: true,
  imports: [ReactiveFormsModule, SearchGooglePlacesComponent],
  templateUrl: './locations-step.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LocationsStepComponent {
  /**
   * FormArray que contiene todas las localizaciones del viaje.
   * Recibido desde el componente padre.
   */
  @Input() locationsFormArray!: FormArray;

  /**
   * Función para añadir una nueva localización (pasada desde el componente padre).
   */
  @Input() onAddLocation!: () => void;

  /**
   * Función para eliminar una localización por índice (pasada desde el componente padre).
   */
  @Input() onRemoveLocation!: (index: number) => void;

  /**
   * Devuelve las localizaciones tipadas como arreglo de FormGroup para facilitar su uso en la vista.
   */
  get typedLocations(): FormGroup[] {
    return this.locationsFormArray.controls as FormGroup[];
  }

  /**
   * Método llamado cuando se selecciona una ubicación desde el componente de búsqueda de Google.
   * Actualiza los campos de localidad, provincia y país en el FormGroup correspondiente.
   * 
   * @param place - Objeto con los datos de la ubicación seleccionada.
   * @param index - Índice del grupo de localización a actualizar.
   */
  onPlaceSelected(place: { city: string, province: string | null, country: string }, index: number) {
    const group = this.locationsFormArray.at(index) as FormGroup;
    group.patchValue({
      locality: place.city,
      province: place.province,
      country: place.country
    });
  }

  /**
   * Devuelve una cadena con la información formateada de la localización completa,
   * uniendo ciudad, provincia y país si están disponibles.
   * 
   * @param index - Índice del FormGroup en el FormArray.
   * @returns Cadena con la localización completa.
   */
  getFullLocation(index: number): string {
    const loc = this.locationsFormArray.at(index);
    const city = loc.get('locality')?.value || '';
    const province = loc.get('province')?.value || null;
    const country = loc.get('country')?.value || null;
    return [city, province, country].filter(Boolean).join(', ');
  }
}
