import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DetailsWeatherTripComponent } from './details-weather-trip/details-weather-trip.component';
import { Trip, Activity } from '../../../interfaces/response.interface';
import { OptionsTripComponent } from './options-trip/options-trip.component';
import { TripService } from '../../../services/trip.service';
import { RecommendationService } from '../../../services/recommendation.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDog, faCat } from '@fortawesome/free-solid-svg-icons';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-trip',
  standalone: true,
  imports: [
    MatIconModule,
    NgClass,
    RouterModule,
    CommonModule,
    FontAwesomeModule,
    DetailsWeatherTripComponent,
    OptionsTripComponent,
  ],
  templateUrl: './trip.component.html',
  styleUrl: './trip.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5)' }),
        animate('0.2s ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'scale(1)' }),
        animate('0.2s ease-in-out', style({ opacity: 0, transform: 'scale(0.5)' }))
      ]),
    ]),
  ]
})
export class TripComponent implements OnInit, OnDestroy {
  @Input() trip!: Trip;

  @Output() deleteEvent = new EventEmitter<void>();
  @Output() updateEvent = new EventEmitter<void>();
  @Output() refreshEvent = new EventEmitter<void>();

  public isLoading: boolean = false;
  public isGeneratingRecs: boolean = false;
  public expand: boolean = false;
  public showActivities: boolean = false;

  public tripWithActivities: any;
  public activities: Activity[] = [];
  public pets: any[] = [];

  public faDog = faDog;
  public faCat = faCat;

  public startDate: Date | null = null;
  public endDate: Date | null = null;
  public dateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  public transportPresenceMap: Record<string, boolean> = {};
  public recommendations: any[] = [];
  public pet_recommendations: any[] = [];

  private recommendationsLoaded = false;
  private petRecommendationsLoaded = false;
  private pollTimer: any = null;

  constructor(
    private tripService: TripService,
    private recommendationService: RecommendationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.tripWithActivities = this.trip;
    this.loadActivities();
    this.loadPets();
    this.isLoading = true;
    this.expand = false;
    this.buildTransportPresenceMap();
    this.dateRange = this.getTripDateRange();
    this.loadRecommendations();
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  loadActivities() {
    this.tripService.getActivitiesTrip(this.trip.id).subscribe({
      next: (response) => {
        this.activities = response;
        this.tripWithActivities.activities = response;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando actividades:', err)
    });
  }

  loadPets() {
    this.tripService.getPetsTrip(this.trip.id).subscribe({
      next: (response) => {
        this.pets = response;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando mascotas:', err)
    });
  }

  loadRecommendations() {
    this.isLoading = true;
    this.recommendationsLoaded = false;
    this.petRecommendationsLoaded = false;
    console.group(`[Trip ${this.trip.id}] loadRecommendations`);

    this.tripService.getRecommendationsTrip(this.trip.id).subscribe({
      next: (response) => {
        this.recommendations = response.data ?? [];
        console.log('recs:', this.recommendations?.length, response.success ? 'ok' : response.message);
        this.recommendationsLoaded = true;
        this.checkLoading();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('recs error:', err.status, err.error?.message);
        this.recommendationsLoaded = true;
        this.checkLoading();
      }
    });

    this.tripService.getPetRecommendationsTrip(this.trip.id).subscribe({
      next: (response) => {
        this.pet_recommendations = response.data ?? [];
        console.log('pet recs:', this.pet_recommendations?.length, response.success ? 'ok' : response.message);
        this.petRecommendationsLoaded = true;
        this.checkLoading();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('pet recs error:', err.status, err.error?.message);
        this.petRecommendationsLoaded = true;
        this.checkLoading();
      }
    });

    console.groupEnd();
  }

  // Genera recomendaciones con todos los tipos disponibles y hace polling hasta que lleguen
  generateRecommendations() {
    if (this.isGeneratingRecs) return;
    this.isGeneratingRecs = true;
    console.log(`[Trip ${this.trip.id}] Generating recommendations...`);

    this.recommendationService.getRecommendationTypes().subscribe({
      next: (response) => {
        const allTypes: any[] = response.data ?? [];
        const generalTypes = allTypes.filter((t: any) => t.category !== 'mascotas');
        const petTypes = allTypes.filter((t: any) => t.category === 'mascotas');
        const hasPets = this.pets.length > 0;

        const calls: any[] = [];

        if (generalTypes.length > 0) {
          calls.push(this.tripService.generateRecommendations(this.trip.id, {
            recommendations_types: generalTypes.map((t: any) => ({ name: t.name }))
          }));
        }

        if (hasPets && petTypes.length > 0) {
          calls.push(this.tripService.generatePetRecommendations(this.trip.id, {
            recommendations_types: petTypes.map((t: any) => ({ name: t.name }))
          }));
        }

        if (calls.length === 0) {
          this.isGeneratingRecs = false;
          return;
        }

        forkJoin(calls).subscribe({
          next: () => {
            console.log(`[Trip ${this.trip.id}] Jobs dispatched, polling for results...`);
            this.startPollingRecommendations();
          },
          error: (err) => {
            console.error('Error dispatching recommendation jobs:', err);
            this.isGeneratingRecs = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error fetching recommendation types:', err);
        this.isGeneratingRecs = false;
      }
    });
  }

  private startPollingRecommendations() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    let attempts = 0;
    const maxAttempts = 12; // 12 × 5s = 60 segundos máximo

    this.pollTimer = setInterval(() => {
      attempts++;
      this.tripService.getRecommendationsTrip(this.trip.id).subscribe({
        next: (response) => {
          const recs = response.data ?? [];
          if (recs.length > 0 || attempts >= maxAttempts) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            this.isGeneratingRecs = false;
            this.loadRecommendations();
          }
        },
        error: () => {
          if (attempts >= maxAttempts) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            this.isGeneratingRecs = false;
          }
        }
      });
    }, 5000);
  }

  private checkLoading() {
    if (this.recommendationsLoaded && this.petRecommendationsLoaded) {
      this.isLoading = false;
    }
  }

  getTripDateRange() {
    if (!this.trip?.locations?.length) return { start: null, end: null };

    const startDates = this.trip.locations.map(loc => new Date(loc.start_date));
    const endDates = this.trip.locations.map(loc => new Date(loc.end_date));

    this.startDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    this.endDate = new Date(Math.max(...endDates.map(d => d.getTime())));

    return { start: this.startDate, end: this.endDate };
  }

  private buildTransportPresenceMap() {
    if (this.trip?.transport) {
      this.transportPresenceMap = this.trip.transport.reduce(
        (acc: Record<string, boolean>, curr: string) => {
          acc[curr] = true;
          return acc;
        },
        {}
      );
    }
  }

  hasTransport(type: string): boolean {
    return !!this.transportPresenceMap[type];
  }

  hasRecommendations(): boolean {
    return (this.recommendations?.length || 0) > 0 || (this.pet_recommendations?.length || 0) > 0;
  }

  expandTrip() {
    this.expand = !this.expand;
  }

  toggleActivities() {
    this.showActivities = !this.showActivities;
  }

  onWeatherRefresh() {
    if (!this.trip?.id) return;
    const tripId = this.trip.id;
    // Recargar viajes para obtener el mismo formato de weather que el dashboard inicial
    this.tripService.getTrips().subscribe({
      next: (trips) => {
        const updated = trips.find(t => t.id === tripId);
        if (updated) {
          this.trip.locations = updated.locations;
          this.trip.last_weather_sync_at = updated.last_weather_sync_at;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error actualizando clima:', err)
    });
  }

  reloadRecommendations() {
    if (this.hasRecommendations()) {
      this.loadRecommendations();
    } else {
      this.generateRecommendations();
    }
  }
}
