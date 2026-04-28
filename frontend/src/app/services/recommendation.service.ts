import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Response } from '../interfaces/response.interface';


@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private serverUrl: string = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
  ) { }

  getRecommendationTypes(): Observable<Response<any>> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/recommendation_types`);
  }

  getRecommendationsTypesFromTrip(id: number): Observable<Response<any>> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/trip/${id}/recommendation_types`);
  }
}
