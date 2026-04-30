import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDog, faCat } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { RecommendationService } from '../../services/recommendation.service';
import { Response } from '../../interfaces/response.interface';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [MatIconModule, FontAwesomeModule],
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)' }),
        animate('0.5s ease-in-out', style({ opacity: 1, transform: 'translateY(0px)' }))
      ])
    ])
  ]
})
export class RecommendationsComponent implements OnInit {
  public tripName: string = '';
  public isLoading: boolean = false;
  public recommendationTypes: any[] = [];
  public recommendations: any[] = [];
  public pet_recommendations: any[] = [];
  public error: string | null = null;
  public expandedCategories: Set<string> = new Set();
  public dog = faDog;
  public cat = faCat;

  constructor(
    private recommendationService: RecommendationService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const tripId = params.get('tripId');
      this.tripName = params.get('tripName') || '';
      
      if (!tripId) {
        this.error = 'No se especificó un ID de viaje';
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        this.router.navigate(['/auth/login']);
        return;
      }

      this.loadRecommendationsForTrip(+tripId);
    });
  }

  toggleCategory(categoryName: string): void {
    if (this.expandedCategories.has(categoryName)) {
      this.expandedCategories.delete(categoryName);
    } else {
      this.expandedCategories.add(categoryName);
    }
  }

  isCategoryExpanded(categoryName: string): boolean {
    return this.expandedCategories.has(categoryName);
  }

  getIconForRecommendation(label: string): string {
    const type = this.recommendationTypes.find(t => t.label === label);
    return type?.icon || 'description';
  }

  private loadRecommendationsForTrip(tripId: number): void {
    this.isLoading = true;
    this.error = null;

    this.recommendationService.getRecommendationsTypesFromTrip(tripId).subscribe({
      next: (response: Response<any[]>) => {
        this.isLoading = false;
        if (response.success) {
          this.recommendationTypes = response.data;
          
          this.recommendationTypes.forEach(category => {
            this.expandedCategories.add(category.name);
          });
        } else {
          this.error = response.message || 'Error al cargar las recomendaciones del viaje';
        }
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isLoading = false;
        this.error = 'Error en la conexión con el servidor';
        if (err.status === 401) {
          this.router.navigate(['/auth/login']);
        }
      }
    });

    this.tripService.getRecommendationsTrip(tripId).subscribe({
      next: (response: Response<any[]>) => {
        this.isLoading = false;
        if (response.success) {
          this.recommendations = response.data; 
        } else {
          this.error = response.message || 'Error al cargar las recomendaciones del viaje';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Error en la conexión con el servidor';
        if (err.status === 401) {
          this.router.navigate(['/auth/login']);
        }
      }
    });

    this.tripService.getPetRecommendationsTrip(tripId).subscribe({
      next: (response: Response<any[]>) => {
        this.isLoading = false;
        if (response.success) {
          this.pet_recommendations = response.data;
        } else {
          this.error = response.message || 'Error al cargar las recomendaciones de mascotas del viaje';
        }
      },
    });
  }

  getPetIcon(pet: string): IconProp {
      if (pet === 'dog') return this.dog as IconProp;
      if (pet === 'cat') return this.cat as IconProp;
      return 'question' as IconProp;
  }
}