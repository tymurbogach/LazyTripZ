export interface User {
  id: number;
  name: string;
  email: string;
  number_phone?: string;
  username: string;
  google_id?: string | null;
  must_set_password: number;
  avatar: string | null;
  avatar_url?: string;
}

export interface Diary {
  id?: number;
  trip_id: number;
  description: string;
  date: Date;
  image_path?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  trip_name?: string;
}

export interface Trip {
  id: number;
  name: string;
  adults: number;
  children: number;
  transport: string[];
  locations: TripLocation[];
  pets: Pet[];
  diaries: Diary[];
  last_weather_sync_at?: Date;
}

// DTO para la creación de un viaje
export interface TripCreationDTO {
  name: string;
  adults: number;
  children: number;
  transport: string[];
}

export interface Pet {
  id: number;
  type: string;
}

export interface TripLocation {
  locality: string;
  province: string;
  country: string;
  start_date: Date;
  end_date: Date;
  weather_forecasts: WeatherForecastDay[];
  activities: Activity[];
}

// DTO para la creación de una ubicación de viaje
export interface TripLocationDTO {
  locality: string;
  province: string;
  country: string;
  start_date: Date;
  end_date: Date;
}

export interface Activity {
  description: string;
  day: Date;
  time_of_day?: Date;
  locality: string;
}

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface WeatherForecastDay {
  forecast: string;
  min_temperature: number;
  max_temperature: number;
  max_rain_probability: number;
  day: Date;
}
