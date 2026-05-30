import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  private destroyRef = inject(DestroyRef);

  constructor(
    private recommendationService: RecommendationService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
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

    this.recommendationService.getRecommendationsTypesFromTrip(tripId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
          this.isLoading = false;
          this.error = 'Error en la conexión con el servidor';
        }
      });

    this.tripService.getRecommendationsTrip(tripId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: Response<any[]>) => {
          this.isLoading = false;
          if (response.success) {
            this.recommendations = response.data;
          } else {
            this.error = response.message || 'Error al cargar las recomendaciones del viaje';
          }
        },
        error: () => {
          this.isLoading = false;
          this.error = 'Error en la conexión con el servidor';
        }
      });

    this.tripService.getPetRecommendationsTrip(tripId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
