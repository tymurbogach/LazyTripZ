import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Response } from '../interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})
export class TripUserService {
  private serverUrl: string = '';

  constructor(
    private http: HttpClient,
  ) { }

  getUsersTrips(id: number): Observable<any> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/trip/${id}/users`);
  }

  getPermissionTrip(id: number): Observable<any> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/trip/${id}/user/permission`);
  }

  addUserTrip(tripId: number, userId: number): Observable<any> {
    return this.http.post<Response<any>>(`${this.serverUrl}/api/trip/${tripId}/users/${userId}`, {});
  }

  updateUserTrip(tripId: number, userId: number, permission: string): Observable<any> {
    return this.http.put<Response<any>>(`${this.serverUrl}/api/trip/${tripId}/users/${userId}`, { permission });
  }

  removeUserTrip(tripId: number, userId: number): Observable<any> {
    return this.http.delete<Response<any>>(`${this.serverUrl}/api/trip/${tripId}/users/${userId}`);
  }

  exitUserTrip(tripId: number): Observable<any> {
    return this.http.delete<Response<any>>(`${this.serverUrl}/api/trip/${tripId}/user`);
  }
}
