import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { forkJoin } from 'rxjs';

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
export class TripComponent implements OnInit {
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
  public tripStatus: 'upcoming' | 'active' | 'past' | 'unknown' = 'unknown';
  public transportPresenceMap: Record<string, boolean> = {};
  public recommendations: any[] = [];
  public pet_recommendations: any[] = [];

  // Recommendation generation progress
  public generationProgress: number = 0;
  public generationEta: number = 0;

  private recommendationsLoaded = false;
  private petRecommendationsLoaded = false;
  private pollTimer: any = null;
  private progressTimer: any = null;

  private destroyRef = inject(DestroyRef);

  constructor(
    private tripService: TripService,
    private recommendationService: RecommendationService,
    private cdr: ChangeDetectorRef
  ) {
    this.destroyRef.onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
      if (this.progressTimer) clearInterval(this.progressTimer);
    });
  }

  ngOnInit() {
    this.tripWithActivities = this.trip;
    this.loadActivities();
    this.loadPets();
    this.isLoading = true;
    this.expand = false;
    this.buildTransportPresenceMap();
    this.dateRange = this.getTripDateRange();
    this.tripStatus = this.getTripStatus();
    this.loadRecommendations();
  }

  loadActivities() {
    this.tripService.getActivitiesTrip(this.trip.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.activities = response;
          this.tripWithActivities.activities = response;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  loadPets() {
    this.tripService.getPetsTrip(this.trip.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.pets = response;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  loadRecommendations() {
    this.isLoading = true;
    this.recommendationsLoaded = false;
    this.petRecommendationsLoaded = false;

    this.tripService.getRecommendationsTrip(this.trip.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.recommendations = response.data ?? [];
          this.recommendationsLoaded = true;
          this.checkLoading();
          this.cdr.detectChanges();
        },
        error: () => {
          this.recommendationsLoaded = true;
          this.checkLoading();
        }
      });

    this.tripService.getPetRecommendationsTrip(this.trip.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.pet_recommendations = response.data ?? [];
          this.petRecommendationsLoaded = true;
          this.checkLoading();
          this.cdr.detectChanges();
        },
        error: () => {
          this.petRecommendationsLoaded = true;
          this.checkLoading();
        }
      });
  }

  generateRecommendations() {
    if (this.isGeneratingRecs) return;
    this.isGeneratingRecs = true;

    this.recommendationService.getRecommendationTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

          // Calculate ETA: total types × 4s stagger + ~10s processing buffer
          const totalTypes = generalTypes.length + (hasPets ? petTypes.length : 0);
          this.generationEta = totalTypes * 4 + 10;
          this.generationProgress = 0;
          this.startProgressTimer();

          forkJoin(calls).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              this.startPollingRecommendations();
            },
            error: () => {
              this.isGeneratingRecs = false;
              this.stopProgressTimer();
              this.cdr.detectChanges();
            }
          });
        },
        error: () => {
          this.isGeneratingRecs = false;
        }
      });
  }

  private startProgressTimer() {
    if (this.progressTimer) clearInterval(this.progressTimer);
    const totalMs = this.generationEta * 1000;
    const startTime = Date.now();

    this.progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      this.generationProgress = Math.min(95, Math.round((elapsed / totalMs) * 100));
      this.cdr.detectChanges();
    }, 500);
  }

  private stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    this.generationProgress = 0;
  }

  private startPollingRecommendations() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    let attempts = 0;
    const maxAttempts = 24; // 24 × 5s = 120s máximo

    this.pollTimer = setInterval(() => {
      attempts++;
      this.tripService.getRecommendationsTrip(this.trip.id).subscribe({
        next: (response) => {
          const recs = response.data ?? [];
          if (recs.length > 0 || attempts >= maxAttempts) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            this.isGeneratingRecs = false;
            this.generationProgress = 100;
            this.stopProgressTimer();
            this.loadRecommendations();
          }
        },
        error: () => {
          if (attempts >= maxAttempts) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            this.isGeneratingRecs = false;
            this.stopProgressTimer();
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

  getTripStatus(): 'upcoming' | 'active' | 'past' | 'unknown' {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (!this.dateRange.start || !this.dateRange.end) return 'unknown';
    const start = new Date(this.dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.dateRange.end);
    end.setHours(23, 59, 59, 999);
    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'active';
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
    this.tripService.getTrips().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (trips) => {
        const updated = trips.find(t => t.id === tripId);
        if (updated) {
          this.trip.locations = updated.locations;
          this.trip.last_weather_sync_at = updated.last_weather_sync_at;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
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
