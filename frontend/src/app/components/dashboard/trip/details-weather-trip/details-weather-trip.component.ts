import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DetailsWeatherLocationDayComponent } from './details-weather-location-day/details-weather-location-day.component';
import { MatIconModule } from '@angular/material/icon';
import { TripService } from '../../../../services/trip.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-details-weather-trip',
  imports: [RouterLink, DetailsWeatherLocationDayComponent, MatIconModule, CommonModule],
  templateUrl: './details-weather-trip.component.html',
  styleUrl: './details-weather-trip.component.css'
})
export class DetailsWeatherTripComponent implements OnInit {
  @Input() tripId?: number;
  @Input() lastUpdated?: Date;
  @Input() locations?: any[] = [];

  @Output() refresh = new EventEmitter<void>();

  public isLoading: boolean = false;

  constructor(
    private tripService: TripService
  ) {}

  ngOnInit(): void {
    this.isLoading = false;
  }

  refreshWeatherForecast(): void {
    if (this.tripId) {
      this.isLoading = true;
      this.tripService.refreshWeatherForecastsTrip(this.tripId).subscribe({
        next: (data) => {
          this.refresh.emit(); 
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
