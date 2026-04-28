import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../../../services/trip.service';
import { DialogService } from '../../../../../services/dialog.service';
import { TripLocation } from '../../../../../interfaces/response.interface';
import { MenuLocationsTripComponent } from './menu-locations-trip/menu-locations-trip.component';
import { DetailsWeatherLocationHourComponent } from './details-weather-location-hour/details-weather-location-hour.component';
import { SpinnerComponent } from '../../../../utilities/spinner/spinner.component';


@Component({
  selector: 'app-more-details-weather-trip',
  imports: [CommonModule, MenuLocationsTripComponent, DetailsWeatherLocationHourComponent, SpinnerComponent],
  templateUrl: './more-details-weather-trip.component.html',
  styleUrl: './more-details-weather-trip.component.css'
})
export class MoreDetailsWeatherTripComponent implements OnInit {
  public tripId?: number;
  public location: string = '';
  public locations: TripLocation[] = [];
  public dataLocation: any[] = [];
  public isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tripIdParam = params.get('tripId');
      const locationParam = params.get('location');

      this.tripId = tripIdParam ? +tripIdParam : undefined;
      this.location = locationParam ?? '';

      if (this.tripId) {
        this.isLoading = true;
        this.getLocationsTrip(this.tripId);
      }
    });
  }

  getLocationsTrip(id: number): void {
    this.tripService.getLocationsTrip(id).subscribe({
      next: (locations: TripLocation[]) => {
        this.isLoading = false;
        this.locations = locations;

        let selectedLocation = this.locations.find(loc =>
          loc.locality.toLowerCase() === this.location.toLowerCase()
        );

        if (selectedLocation) {
          this.dataLocation = selectedLocation.weather_forecasts;
        }
      },
      error: (err) => {
        this.dialogService.fatalError('Error en la conexión con el servidor');
      }
    });
  }

}
