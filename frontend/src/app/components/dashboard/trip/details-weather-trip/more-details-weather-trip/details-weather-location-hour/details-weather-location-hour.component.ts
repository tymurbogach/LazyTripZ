import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherIconService } from '../../../../../../services/weather-icon.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-details-weather-location-hour',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './details-weather-location-hour.component.html',
  styleUrl: './details-weather-location-hour.component.css'
})
export class DetailsWeatherLocationHourComponent implements OnInit, OnChanges {
  @Input() time?: string = '00:00';
  @Input() forecast?: string;
  @Input() temperature?: number = 15;
  @Input() chanceOfRain?: number = 0;

  iconUrl: string = '';

  constructor(private weatherIconService: WeatherIconService) {}

  ngOnInit() {
    this.setWeatherIcon();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forecast']) {
      this.setWeatherIcon();
    }
  }

  private setWeatherIcon(): void {
    this.iconUrl = this.weatherIconService.getAnimatedIconUrl(this.forecast || '');
  }
}
