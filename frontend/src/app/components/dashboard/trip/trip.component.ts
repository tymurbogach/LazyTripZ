import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DetailsWeatherTripComponent } from './details-weather-trip/details-weather-trip.component';
import { Trip, Activity } from '../../../interfaces/response.interface';
import { OptionsTripComponent } from './options-trip/options-trip.component';
import { TripService } from '../../../services/trip.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDog, faCat } from '@fortawesome/free-solid-svg-icons';

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
    CommonModule,
    OptionsTripComponent
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

  constructor(
    private tripService: TripService,
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

  loadActivities() {
    this.tripService.getActivitiesTrip(this.trip.id).subscribe({
      next: (response) => {
        this.activities = response;
        this.tripWithActivities.activities = response;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando actividades:', err);
      }
    });
  }

  loadPets() {
    this.tripService.getPetsTrip(this.trip.id).subscribe({
      next: (response) => {
        this.pets = response;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando mascotas:', err);
      }
    });
  }

  loadRecommendations() {
    this.isLoading = true;
    this.recommendationsLoaded = false;
    this.petRecommendationsLoaded = false;

    this.tripService.getRecommendationsTrip(this.trip.id).subscribe({
      next: (response) => {
        this.recommendations = response.data;
        this.recommendationsLoaded = true;
        this.checkLoading();
        this.cdr.detectChanges();
      },
      error: () => {
        this.recommendationsLoaded = true;
        this.checkLoading();
      }
    });

    this.tripService.getPetRecommendationsTrip(this.trip.id).subscribe({
      next: (response) => {
        this.pet_recommendations = response.data;
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

    return {
      start: this.startDate,
      end: this.endDate
    };
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
    if (this.trip?.id) {
      this.tripService.getTripById(this.trip.id).subscribe({
        next: (trip) => {
          this.trip.last_weather_sync_at = trip.last_weather_sync_at;
          this.refreshEvent.emit();
        },
        error: (error) => {
          console.error('Error refreshing weather:', error);
        }
      });
    }
  }
}
