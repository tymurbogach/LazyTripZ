import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WeatherIconService {
  private readonly baseUrl = 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/';

  getAnimatedIconUrl(weatherType: string): string {
    switch (weatherType?.toLowerCase()) {
      case 'clear':
        return `${this.baseUrl}day.svg`;
      case 'clouds':
        return `${this.baseUrl}cloudy.svg`;
      case 'rain':
        return `${this.baseUrl}rainy-5.svg`;
      case 'drizzle':
        return `${this.baseUrl}rainy-1.svg`;
      case 'thunderstorm':
        return `${this.baseUrl}thunder.svg`;
      case 'snow':
        return `${this.baseUrl}snowy.svg`;
      default:
        return `${this.baseUrl}cloudy-day-1.svg`;
    }
  }
} 