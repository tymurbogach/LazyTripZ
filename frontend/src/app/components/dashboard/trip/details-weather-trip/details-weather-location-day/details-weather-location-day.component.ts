import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherForecastDay } from '../../../../../interfaces/response.interface';
import { WeatherIconService } from '../../../../../services/weather-icon.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-details-weather-location-day',
  imports: [CommonModule, MatIconModule],
  templateUrl: './details-weather-location-day.component.html',
  styleUrl: './details-weather-location-day.component.css'
})
export class DetailsWeatherLocationDayComponent {
  @Input() weatherForecast?: WeatherForecastDay;

  iconUrl: string = '';

  constructor(private weatherIconService: WeatherIconService) {}
  
    ngOnInit() {
      this.setWeatherIcon();
    }

  private setWeatherIcon(): void {
    this.iconUrl = this.weatherIconService.getAnimatedIconUrl(this.weatherForecast?.forecast || '');
  }
}
