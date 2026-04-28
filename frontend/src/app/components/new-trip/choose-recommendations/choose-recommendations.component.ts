import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

/**
 * Componente para seleccionar recomendaciones de una lista.
 * Permite alternar recomendaciones y notifica los cambios al componente padre.
 */
@Component({
  selector: 'app-choose-recommendations',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './choose-recommendations.component.html',
  styleUrl: './choose-recommendations.component.css'
})
export class ChooseRecommendationsComponent implements OnInit, OnChanges {
  /**
   * Lista de recomendaciones disponibles para seleccionar.
   */
  @Input() recommendations: any[] = [];

  /**
   * Lista de recomendaciones seleccionadas (recibidas desde el padre).
   */
  @Input() selected: any[] = [];

  /**
   * Evento emitido cuando cambia la selección de recomendaciones.
   */
  @Output() selectedChange: EventEmitter<any[]> = new EventEmitter();

  /**
   * Lista interna que gestiona la selección activa en el componente.
   */
  public selectedRecommendations: any[] = [];

  /**
   * Al iniciar el componente, se copia la selección inicial desde el padre.
   */
  ngOnInit(): void {
    this.selectedRecommendations = [...this.selected];
  }

  /**
   * Detecta cambios en los inputs del componente.
   * - Si cambia la lista de recomendaciones, se limpia la selección si esta queda vacía.
   * - Si cambia la selección externa, se actualiza la interna.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selected']) {
      this.selectedRecommendations = [...this.selected];
    }

    // Si ya no hay recomendaciones disponibles, limpiar la selección
    if (changes['recommendations'] && this.recommendations.length === 0) {
      this.selectedRecommendations = [];
      this.selectedChange.emit([]);
    }
  }

  /**
   * Alterna el estado de selección de una recomendación.
   * - Si ya estaba seleccionada, la elimina.
   * - Si no lo estaba, la agrega.
   * Finalmente, emite la lista actualizada al componente padre.
   * @param recommendation Recomendación a alternar.
   */
  public toggleRecommendation(recommendation: any): void {
    const index = this.selectedRecommendations.findIndex(
      rec => rec.name === recommendation.name 
    );
    if (index > -1) {
      this.selectedRecommendations.splice(index, 1);
    } else {
      this.selectedRecommendations.push(recommendation);
    }
    this.selectedChange.emit(this.selectedRecommendations);
  }

  /**
   * Verifica si una recomendación está actualmente seleccionada.
   * @param recommendation Recomendación a verificar.
   * @returns true si está seleccionada, false si no.
   */
  public isRecommendationSelected(recommendation: any): boolean {
    return this.selectedRecommendations.some(
      rec => rec.name === recommendation.name 
    );
  }
}
