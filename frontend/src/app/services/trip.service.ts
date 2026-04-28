import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Activity, Pet, Response, Trip, WeatherForecastDay, TripLocation, TripCreationDTO, TripLocationDTO } from '../interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private serverUrl: string = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de viajes del usuario autenticado.
   */
  getTrips(): Observable<Trip[]> {
    return this.http.get<Response<Trip[]>>(`${this.serverUrl}/api/user/trips`).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtiene un viaje por su ID.
   * @param id - ID del viaje.
   */
  getTripById(id: number): Observable<Trip> {
    return this.http.get<{ success: boolean; message: string; data: Trip }>(`${this.serverUrl}/api/trips/${id}`)
      .pipe(map(resp => resp.data));
  }

  /**
   * Obtiene las mascotas asociadas a un viaje.
   * @param tripId - ID del viaje.
   */
  getPetsTrip(tripId: number): Observable<Pet[]> {
    return this.http.get<{ success: boolean, message: string, data: Pet[] }>(`${this.serverUrl}/api/trip/${tripId}/pets`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Obtiene todas las ubicaciones de un viaje, incluyendo clima y actividades.
   */
  getLocationsTrip(id: number): Observable<TripLocation[]> {
    return this.http.get<Response<TripLocation[]>>(`${this.serverUrl}/api/trip/${id}/locations`)
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene las ubicaciones del viaje excluyendo información adicional como clima y actividades.
   */
  getSimpleLocationsTrip(id: number): Observable<TripLocation[]> {
    return this.http
      .get<Response<TripLocation[]>>(`${this.serverUrl}/api/trip/${id}/locations/simple`)
      .pipe(map((response) => response.data));
  }

  /**
   * Crea un nuevo viaje.
   */
  addTrip(data: TripCreationDTO): Observable<{ success: boolean; message: string; data: Trip }> {
    return this.http.post<{ success: boolean; message: string; data: Trip }>(`${this.serverUrl}/api/trips`, data);
  }

  /**
   * Elimina un viaje existente.
   */
  deleteTrip(id: number): Observable<Trip> {
    return this.http.delete<Trip>(`${this.serverUrl}/api/trips/${id}`);
  }

  /**
   * Actualiza los datos generales de un viaje.
   */
  updateTrip(id: number, data: Trip): Observable<Trip> {
    return this.http.put<Trip>(`${this.serverUrl}/api/trips/${id}`, data);
  }

  /**
   * Añade nuevas mascotas a un viaje.
   */
  addPetsTrip(id: number, data: { pets: Pet[] }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.serverUrl}/api/trip/${id}/pets`, data);
  }

  /**
   * Elimina mascotas específicas de un viaje.
   */
  deletePetsTrip(id: number, data: { pets: { id: number }[] }): Observable<any> {
    return this.http.request('delete', `${this.serverUrl}/api/trip/${id}/pets`, { body: data });
  }

  /**
   * Añade ubicaciones a un viaje.
   */
  addLocationsTrip(id: number, data: { locations: TripLocationDTO[] }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.serverUrl}/api/trip/${id}/locations`, data);
  }

  /**
   * Actualiza todas las ubicaciones de un viaje.
   */
  updateLocationsTrip(id: number, data: any): Observable<TripLocation> {
    return this.http.put<TripLocation>(`${this.serverUrl}/api/trip/${id}/locations`, data);
  }

  /**
   * Elimina ubicaciones específicas de un viaje.
   */
  deleteLocationsTrip(id: number, data: { locations: { locality: string }[] }): Observable<{ success: boolean; message: string }> {
    return this.http.request<{ success: boolean; message: string }>(
      'delete',
      `${this.serverUrl}/api/trip/${id}/locations`,
      { body: data }
    );
  }

  /**
   * Genera las previsiones del tiempo para todas las ubicaciones del viaje.
   */
  generateWeatherForecastsTrip(id: number): Observable<WeatherForecastDay> {
    return this.http.post<WeatherForecastDay>(`${this.serverUrl}/api/trip/${id}/weather_forecasts`, {});
  }

  /**
   * Refresco las previsiones del tiempo para todas las ubicaciones del viaje.
   */
  refreshWeatherForecastsTrip(id: number): Observable<WeatherForecastDay> {
    return this.http.post<WeatherForecastDay>(`${this.serverUrl}/api/trip/${id}/weather_forecasts/refresh`, {});
  }

  /**
   * Obtiene las actividades asociadas a un viaje.
   */
  getActivitiesTrip(id: number): Observable<Activity[]> {
  return this.http.get<{ success: boolean; message: string; data: Activity[] }>(`${this.serverUrl}/api/trip/${id}/activities`)
    .pipe(map(response => response.data));
  }

  /**
   * Añade actividades a un viaje.
   */
  addActivitiesTrip(id: number, data: { activities: Activity[] }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.serverUrl}/api/trip/${id}/activities`, data);
  }

  /**
   * Actualiza actividades de un viaje.
   */
  updateActivitiesTrip(id: number, data: { activities: Activity[] }): Observable<{ success: boolean; message: string }> {
  return this.http.put<{ success: boolean; message: string }>(`${this.serverUrl}/api/trip/${id}/activities`, data);
  }

  /**
   * Elimina actividades específicas de un viaje.
   */
  deleteActivitiesTrip(id: number, data: { activities: { id: number }[] }): Observable<{ success: boolean; message: string }> {
    return this.http.request<{ success: boolean; message: string }>(
      'delete',
      `${this.serverUrl}/api/trip/${id}/activities`,
      { body: data }
    );
  }

  // ──────────────────────── Recomendaciones generales ────────────────────────

  /**
   * Obtiene las recomendaciones generales asociadas a un viaje.
   */
  getRecommendationsTrip(id: number): Observable<Response<any>> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/trip/${id}/recommendations`);
  }

  /**
   * Genera nuevas recomendaciones generales para un viaje.
   */
  generateRecommendations(tripId: number, data: { recommendations_types: { name: string }[] }) {
    return this.http.post(`${this.serverUrl}/api/trip/${tripId}/recommendations`, data);
  }

  /**
   * Elimina todas las recomendaciones generales de un viaje.
   */
  deleteRecommendations(tripId: number): Observable<any> {
    return this.http.request('delete', `${this.serverUrl}/api/trip/${tripId}/recommendations`);
  }

  // ──────────────────────── Recomendaciones de mascotas ────────────────────────

  /**
   * Obtiene las recomendaciones específicas para mascotas en un viaje.
   */
  getPetRecommendationsTrip(id: number): Observable<Response<any>> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/trip/${id}/pet_recommendations`);
  }

  /**
   * Genera recomendaciones específicas para mascotas.
   */
  generatePetRecommendations(tripId: number, data: { recommendations_types: { name: string }[] }) {
    return this.http.post(`${this.serverUrl}/api/trip/${tripId}/pet_recommendations`, data);
  }

  /**
   * Elimina todas las recomendaciones para mascotas de un viaje.
   */
  deletePetRecommendations(tripId: number): Observable<any> {
    return this.http.request('delete', `${this.serverUrl}/api/trip/${tripId}/pet_recommendations`);
  }

  getDiaries(tripId: number){}

}

